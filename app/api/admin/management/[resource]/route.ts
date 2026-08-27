import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { APPLICATION_FILTER, nextMembershipPeriod } from '@/lib/membership';

const resourceSchema = z.enum(['applications', 'members', 'messages', 'subscribers', 'statistics', 'settings', 'gallery', 'resources', 'team']);
const applicationStatusSchema = z.enum(['APPROVED', 'REJECTED']);
const memberStatusSchema = z.enum(['APPROVED', 'SUSPENDED']);

const memberSelect = {
  id: true, firstName: true, lastName: true, email: true, phone: true, platform: true,
  vehicleInfo: true, location: true, status: true, registrationPayment: true,
  membershipEndDate: true, internalNotes: true, createdAt: true
} as const;

async function authenticatedResource(params: Promise<{ resource: string }>) {
  const user = await requireAdmin();
  if (!user) return { error: NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 }) };
  const parsed = resourceSchema.safeParse((await params).resource);
  if (!parsed.success) return { error: NextResponse.json({ error: 'Unknown management resource.' }, { status: 404 }) };
  return { user, resource: parsed.data };
}

export async function GET(_request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const auth = await authenticatedResource(params);
  if ('error' in auth) return auth.error;
  const { resource } = auth;
  if (resource === 'applications') return NextResponse.json(await db.member.findMany({ where: APPLICATION_FILTER, select: memberSelect, orderBy: { createdAt: 'desc' } }));
  if (resource === 'members') return NextResponse.json(await db.member.findMany({ where: { status: { in: ['APPROVED', 'SUSPENDED'] } }, select: memberSelect, orderBy: { createdAt: 'desc' } }));
  if (resource === 'messages') return NextResponse.json(await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }));
  if (resource === 'subscribers') return NextResponse.json(await db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } }));
  if (resource === 'statistics') return NextResponse.json(await db.statistic.findMany({ orderBy: { displayOrder: 'asc' } }));
  // Paystack keys are secrets – excluded from the generic settings table.
  if (resource === 'settings') return NextResponse.json(await db.siteSetting.findMany({ where: { key: { not: { startsWith: 'paystack_' } } }, orderBy: { key: 'asc' } }));
  if (resource === 'gallery') return NextResponse.json(await db.galleryItem.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }));
  if (resource === 'resources') return NextResponse.json(await db.resource.findMany({ orderBy: { updatedAt: 'desc' } }));
  return NextResponse.json(await db.teamMember.findMany({ orderBy: { displayOrder: 'asc' } }));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const auth = await authenticatedResource(params);
  if ('error' in auth) return auth.error;
  const { resource, user } = auth;
  const body = await request.json();
  const id = z.string().uuid().safeParse(body.id);
  if (!id.success) return NextResponse.json({ error: 'A valid record id is required.' }, { status: 400 });

  let result: unknown;
  if (resource === 'applications') {
    // Approving an application promotes the applicant to a full member and
    // starts their first membership year. Rejecting keeps the record for audit.
    const status = applicationStatusSchema.safeParse(body.status);
    if (!status.success) return NextResponse.json({ error: 'Applications can only be approved or rejected.' }, { status: 400 });
    const applicant = await db.member.findUnique({ where: { id: id.data } });
    if (!applicant) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (applicant.status !== 'PENDING') return NextResponse.json({ error: 'This application has already been processed.' }, { status: 409 });
    if (status.data === 'APPROVED') {
      const { start, end } = nextMembershipPeriod(applicant.membershipEndDate);
      result = await db.member.update({
        where: { id: id.data },
        data: {
          status: 'APPROVED',
          membershipStartDate: applicant.membershipStartDate ?? start,
          membershipEndDate: applicant.membershipEndDate ?? end,
          internalNotes: body.internalNotes === undefined ? undefined : String(body.internalNotes)
        }
      });
    } else {
      result = await db.member.update({ where: { id: id.data }, data: { status: 'REJECTED', internalNotes: body.internalNotes === undefined ? undefined : String(body.internalNotes) } });
    }
  } else if (resource === 'members') {
    const status = memberStatusSchema.safeParse(body.status);
    if (!status.success) return NextResponse.json({ error: 'Members can be active or suspended.' }, { status: 400 });
    result = await db.member.update({ where: { id: id.data }, data: { status: status.data, internalNotes: body.internalNotes === undefined ? undefined : String(body.internalNotes) } });
  } else if (resource === 'messages') {
    result = await db.contactMessage.update({ where: { id: id.data }, data: { read: body.read === undefined ? undefined : Boolean(body.read), archived: body.archived === undefined ? undefined : Boolean(body.archived) } });
  } else if (resource === 'subscribers') {
    result = await db.newsletterSubscriber.update({ where: { id: id.data }, data: { active: Boolean(body.active) } });
  } else if (resource === 'statistics') {
    result = await db.statistic.update({ where: { id: id.data }, data: { label: String(body.label), value: String(body.value), description: body.description ? String(body.description) : null, displayOrder: Number(body.displayOrder || 0), active: body.active !== false } });
  } else if (resource === 'settings') {
    if (String(body.key || '').startsWith('paystack_')) {
      return NextResponse.json({ error: 'Paystack keys are managed on the dedicated Paystack settings page.' }, { status: 400 });
    }
    result = await db.siteSetting.upsert({ where: { id: id.data }, update: { value: String(body.value) }, create: { id: id.data, key: String(body.key), value: String(body.value) } });
  } else if (resource === 'gallery') {
    result = await db.galleryItem.update({ where: { id: id.data }, data: { title: body.title === undefined ? undefined : String(body.title), caption: body.caption === undefined ? undefined : String(body.caption), altText: body.altText === undefined ? undefined : String(body.altText), category: body.category === undefined ? undefined : String(body.category), featured: body.featured === undefined ? undefined : Boolean(body.featured), displayOrder: body.displayOrder === undefined ? undefined : Number(body.displayOrder) } });
  } else if (resource === 'resources') {
    result = await db.resource.update({ where: { id: id.data }, data: { title: body.title === undefined ? undefined : String(body.title), description: body.description === undefined ? undefined : String(body.description), category: body.category === undefined ? undefined : String(body.category), fileUrl: body.fileUrl === undefined ? undefined : String(body.fileUrl), thumbnailUrl: body.thumbnailUrl === undefined ? undefined : String(body.thumbnailUrl), published: body.published === undefined ? undefined : Boolean(body.published) } });
  } else {
    result = await db.teamMember.update({ where: { id: id.data }, data: { name: body.name === undefined ? undefined : String(body.name), position: body.position === undefined ? undefined : String(body.position), biography: body.biography === undefined ? undefined : String(body.biography), imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl), displayOrder: body.displayOrder === undefined ? undefined : Number(body.displayOrder), active: body.active === undefined ? undefined : Boolean(body.active) } });
  }

  await db.auditLog.create({ data: { userId: user.id, action: 'UPDATE', entity: resource, entityId: id.data } });
  return NextResponse.json(result);
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const auth = await authenticatedResource(params);
  if ('error' in auth) return auth.error;
  const { resource, user } = auth;
  const body = await request.json();

  let created: unknown;
  if (resource === 'gallery') {
    const imageUrl = String(body.imageUrl || '').trim();
    const title = String(body.title || '').trim();
    if (!imageUrl || !title) return NextResponse.json({ error: 'A title and an uploaded image are required.' }, { status: 400 });
    created = await db.galleryItem.create({
      data: {
        title,
        caption: body.caption ? String(body.caption) : null,
        imageUrl,
        altText: String(body.altText || title),
        category: body.category ? String(body.category) : null,
        featured: Boolean(body.featured),
        displayOrder: Number(body.displayOrder || 0)
      }
    });
  } else if (resource === 'resources') {
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const category = String(body.category || '').trim();
    const fileUrl = String(body.fileUrl || '').trim();
    if (!title || !description || !category || !fileUrl) {
      return NextResponse.json({ error: 'Title, description, category and an uploaded PDF are required.' }, { status: 400 });
    }
    created = await db.resource.create({
      data: { title, description, category, fileUrl, published: Boolean(body.published) }
    });
  } else {
    return NextResponse.json({ error: 'Creation is not available for this resource yet.' }, { status: 400 });
  }

  await db.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: resource, entityId: (created as { id: string }).id } });
  return NextResponse.json(created, { status: 201 });
}

const deletableResources = new Set(['messages', 'subscribers', 'statistics', 'gallery', 'resources', 'team']);

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const auth = await authenticatedResource(params);
  if ('error' in auth) return auth.error;
  const { resource, user } = auth;
  if (!deletableResources.has(resource)) {
    return NextResponse.json({ error: 'This resource cannot be deleted.' }, { status: 400 });
  }
  const body = await request.json();
  const id = z.string().uuid().safeParse(body.id);
  if (!id.success) return NextResponse.json({ error: 'A valid record id is required.' }, { status: 400 });

  if (resource === 'messages') await db.contactMessage.delete({ where: { id: id.data } });
  else if (resource === 'subscribers') await db.newsletterSubscriber.delete({ where: { id: id.data } });
  else if (resource === 'statistics') await db.statistic.delete({ where: { id: id.data } });
  else if (resource === 'gallery') await db.galleryItem.delete({ where: { id: id.data } });
  else if (resource === 'resources') await db.resource.delete({ where: { id: id.data } });
  else await db.teamMember.delete({ where: { id: id.data } });

  await db.auditLog.create({ data: { userId: user.id, action: 'DELETE', entity: resource, entityId: id.data } });
  return NextResponse.json({ success: true });
}
