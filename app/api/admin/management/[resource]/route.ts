import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { APPLICATION_FILTER } from '@/lib/membership';
import { WORK_APPLICATION_FILTER, workApplicationSelect } from '@/lib/work-applications';

const resourceSchema = z.enum([
  'applications', 'members', 'messages', 'subscribers', 'statistics', 'settings',
  'gallery', 'resources', 'team', 'services', 'vehicles', 'rentals', 'products', 'recruitment',
  'work-applications', 'opportunities', 'product-categories'
]);
const applicationStatusSchema = z.enum(['APPROVED', 'REJECTED']);
const memberStatusSchema = z.enum(['APPROVED', 'SUSPENDED']);
const rentalStatusSchema = z.enum(['NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED']);
const driverApplicationStatusSchema = z.enum(['NEW', 'REVIEWING', 'HIRED', 'DECLINED']);
const workApplicationStatusSchema = z.enum(['NEW', 'REVIEWING', 'INTERVIEW', 'HIRED', 'REJECTED']);
const opportunityStatusSchema = z.enum(['OPEN', 'CLOSED', 'ARCHIVED']);

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
  if (resource === 'work-applications') return NextResponse.json(await db.workApplication.findMany({ where: WORK_APPLICATION_FILTER, select: workApplicationSelect, orderBy: { createdAt: 'desc' } }));
  if (resource === 'opportunities') return NextResponse.json(await db.driverOpportunity.findMany({ include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } }));
  if (resource === 'product-categories') return NextResponse.json(await db.productCategory.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } }));
  if (resource === 'members') return NextResponse.json(await db.member.findMany({ where: { status: { in: ['APPROVED', 'SUSPENDED'] } }, select: memberSelect, orderBy: { createdAt: 'desc' } }));
  if (resource === 'messages') return NextResponse.json(await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }));
  if (resource === 'subscribers') return NextResponse.json(await db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } }));
  if (resource === 'statistics') return NextResponse.json(await db.statistic.findMany({ orderBy: { displayOrder: 'asc' } }));
  if (resource === 'settings') return NextResponse.json(await db.siteSetting.findMany({ orderBy: { key: 'asc' } }));
  if (resource === 'gallery') return NextResponse.json(await db.galleryItem.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }));
  if (resource === 'resources') return NextResponse.json(await db.resource.findMany({ orderBy: { updatedAt: 'desc' } }));
  if (resource === 'services') return NextResponse.json(await db.service.findMany({ orderBy: { displayOrder: 'asc' } }));
  if (resource === 'vehicles') return NextResponse.json(await db.vehicle.findMany({ include: { images: { orderBy: { position: 'asc' } } }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }] }));
  if (resource === 'rentals') return NextResponse.json(await db.rentalInquiry.findMany({ include: { vehicle: { select: { make: true, model: true, year: true } } }, orderBy: { createdAt: 'desc' } }));
  if (resource === 'products') return NextResponse.json(await db.product.findMany({ orderBy: { createdAt: 'desc' } }));
  if (resource === 'recruitment') return NextResponse.json(await db.driverApplication.findMany({ orderBy: { createdAt: 'desc' } }));
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
    // Approving an application promotes the applicant to a full member.
    // Membership is free, so the member is active immediately. Rejecting keeps
    // the record for audit.
    const status = applicationStatusSchema.safeParse(body.status);
    if (!status.success) return NextResponse.json({ error: 'Applications can only be approved or rejected.' }, { status: 400 });
    const applicant = await db.member.findUnique({ where: { id: id.data } });
    if (!applicant) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (applicant.status !== 'PENDING') return NextResponse.json({ error: 'This application has already been processed.' }, { status: 409 });
    if (status.data === 'APPROVED') {
      result = await db.member.update({
        where: { id: id.data },
        data: {
          status: 'APPROVED',
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
    result = await db.siteSetting.upsert({ where: { id: id.data }, update: { value: String(body.value) }, create: { id: id.data, key: String(body.key), value: String(body.value) } });
  } else if (resource === 'gallery') {
    result = await db.galleryItem.update({ where: { id: id.data }, data: { title: body.title === undefined ? undefined : String(body.title), caption: body.caption === undefined ? undefined : String(body.caption), altText: body.altText === undefined ? undefined : String(body.altText), category: body.category === undefined ? undefined : String(body.category), featured: body.featured === undefined ? undefined : Boolean(body.featured), displayOrder: body.displayOrder === undefined ? undefined : Number(body.displayOrder) } });
  } else if (resource === 'resources') {
    result = await db.resource.update({ where: { id: id.data }, data: { title: body.title === undefined ? undefined : String(body.title), description: body.description === undefined ? undefined : String(body.description), category: body.category === undefined ? undefined : String(body.category), fileUrl: body.fileUrl === undefined ? undefined : String(body.fileUrl), thumbnailUrl: body.thumbnailUrl === undefined ? undefined : String(body.thumbnailUrl), published: body.published === undefined ? undefined : Boolean(body.published) } });
  } else if (resource === 'services') {
    result = await db.service.update({
      where: { id: id.data },
      data: {
        name: body.name === undefined ? undefined : String(body.name),
        slug: body.slug === undefined ? undefined : String(body.slug),
        description: body.description === undefined ? undefined : String(body.description),
        category: body.category === undefined ? undefined : String(body.category),
        imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl),
        ctaLabel: body.ctaLabel === undefined ? undefined : String(body.ctaLabel),
        ctaHref: body.ctaHref === undefined ? undefined : String(body.ctaHref),
        displayOrder: body.displayOrder === undefined ? undefined : Number(body.displayOrder),
        enabled: body.enabled === undefined ? undefined : Boolean(body.enabled)
      }
    });
  } else if (resource === 'vehicles') {
    const updatedVehicle = await db.vehicle.update({
      where: { id: id.data },
      data: {
        make: body.make === undefined ? undefined : String(body.make),
        model: body.model === undefined ? undefined : String(body.model),
        year: body.year === undefined ? undefined : Number(body.year),
        category: body.category === undefined ? undefined : String(body.category),
        transmission: body.transmission === undefined ? undefined : String(body.transmission),
        fuelType: body.fuelType === undefined ? undefined : String(body.fuelType),
        seats: body.seats === undefined ? undefined : Number(body.seats),
        description: body.description === undefined ? undefined : String(body.description),
        features: body.features === undefined ? undefined : body.features,
        price: body.price === undefined ? undefined : (body.price === null ? null : Number(body.price)),
        dailyRate: body.dailyRate === undefined ? undefined : (body.dailyRate === null ? null : Number(body.dailyRate)),
        availability: body.availability === undefined ? undefined : String(body.availability),
        featured: body.featured === undefined ? undefined : Boolean(body.featured)
      }
    });
    result = updatedVehicle;
    // Replacing the photo set: wipe and recreate in display order so the
    // admin edit modal can add/remove images freely.
    if (Array.isArray(body.images)) {
      const urls: string[] = (body.images as unknown[]).map((url) => String(url).trim()).filter(Boolean).slice(0, 8);
      await db.vehicleImage.deleteMany({ where: { vehicleId: id.data } });
      if (urls.length) {
        await db.vehicleImage.createMany({ data: urls.map((url, position) => ({ vehicleId: id.data, url, position, altText: `${updatedVehicle.make} ${updatedVehicle.model}` })) });
      }
      result = await db.vehicle.findUnique({ where: { id: id.data }, include: { images: { orderBy: { position: 'asc' } } } });
    }
  } else if (resource === 'rentals') {
    const status = rentalStatusSchema.safeParse(body.status);
    if (!status.success) return NextResponse.json({ error: 'Rental enquiries can be NEW, CONTACTED, CONFIRMED or DECLINED.' }, { status: 400 });
    result = await db.rentalInquiry.update({ where: { id: id.data }, data: { status: status.data, notes: body.notes === undefined ? undefined : String(body.notes) } });
  } else if (resource === 'products') {
    result = await db.product.update({
      where: { id: id.data },
      data: {
        name: body.name === undefined ? undefined : String(body.name),
        sku: body.sku === undefined ? undefined : String(body.sku),
        description: body.description === undefined ? undefined : String(body.description),
        imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl),
        price: body.price === undefined ? undefined : Number(body.price),
        stock: body.stock === undefined ? undefined : Number(body.stock),
        brand: body.brand === undefined ? undefined : String(body.brand),
        categoryId: body.categoryId === undefined ? undefined : (body.categoryId || null),
        available: body.available === undefined ? undefined : Boolean(body.available)
      }
    });
  } else if (resource === 'recruitment') {
    const status = driverApplicationStatusSchema.safeParse(body.status);
    if (!status.success) return NextResponse.json({ error: 'Driver applications can be NEW, REVIEWING, HIRED or DECLINED.' }, { status: 400 });
    result = await db.driverApplication.update({ where: { id: id.data }, data: { status: status.data, internalNotes: body.internalNotes === undefined ? undefined : String(body.internalNotes) } });
  } else if (resource === 'work-applications') {
    const status = workApplicationStatusSchema.safeParse(body.status);
    if (!status.success) return NextResponse.json({ error: 'Work applications can be NEW, REVIEWING, INTERVIEW, HIRED or REJECTED.' }, { status: 400 });
    const existing = await db.workApplication.findUnique({ where: { id: id.data }, select: { reviewedAt: true } });
    if (!existing) return NextResponse.json({ error: 'Work application not found.' }, { status: 404 });
    result = await db.workApplication.update({
      where: { id: id.data },
      data: {
        status: status.data,
        internalNotes: body.internalNotes === undefined ? undefined : String(body.internalNotes),
        // Stamp reviewedAt the first time a recruiter moves the application
        // forward — gives the pipeline a measurable "time to first review".
        reviewedAt: existing.reviewedAt ?? (status.data !== 'NEW' ? new Date() : undefined)
      }
    });
  } else if (resource === 'opportunities') {
    const status = body.status === undefined ? null : opportunityStatusSchema.safeParse(body.status);
    if (status && !status.success) return NextResponse.json({ error: 'Opportunities can be OPEN, CLOSED or ARCHIVED.' }, { status: 400 });
    result = await db.driverOpportunity.update({
      where: { id: id.data },
      data: {
        title: body.title === undefined ? undefined : String(body.title),
        slug: body.slug === undefined ? undefined : String(body.slug),
        description: body.description === undefined ? undefined : String(body.description),
        requirements: body.requirements === undefined ? undefined : body.requirements,
        benefits: body.benefits === undefined ? undefined : body.benefits,
        status: status?.data
      }
    });
  } else if (resource === 'product-categories') {
    result = await db.productCategory.update({
      where: { id: id.data },
      data: {
        name: body.name === undefined ? undefined : String(body.name),
        slug: body.slug === undefined ? undefined : String(body.slug)
      }
    });
  } else {
    result = await db.teamMember.update({ where: { id: id.data }, data: { name: body.name === undefined ? undefined : String(body.name), position: body.position === undefined ? undefined : String(body.position), biography: body.biography === undefined ? undefined : String(body.biography), imageUrl: body.imageUrl === undefined ? undefined : String(body.imageUrl), displayOrder: body.displayOrder === undefined ? undefined : Number(body.displayOrder), active: body.active === undefined ? undefined : Boolean(body.active) } });
  }

  await db.auditLog.create({ data: { userId: user.id, action: 'UPDATE', entity: resource, entityId: id.data } });
  return NextResponse.json(result);
}

const serviceCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140),
  description: z.string().trim().min(2).max(4000),
  category: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().max(500).optional(),
  ctaLabel: z.string().trim().max(60).optional(),
  ctaHref: z.string().trim().max(200).optional(),
  displayOrder: z.coerce.number().int().default(0),
  enabled: z.coerce.boolean().default(true)
});

const vehicleCreateSchema = z.object({
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1950).max(2100),
  category: z.string().trim().min(2).max(80),
  transmission: z.string().trim().max(40).optional(),
  fuelType: z.string().trim().max(40).optional(),
  seats: z.coerce.number().int().min(1).max(60).optional(),
  description: z.string().trim().max(4000).optional(),
  price: z.coerce.number().int().min(0).optional(),
  dailyRate: z.coerce.number().int().min(0).optional(),
  availability: z.enum(['AVAILABLE', 'RESERVED', 'RENTED', 'SOLD']).default('AVAILABLE'),
  featured: z.coerce.boolean().default(false)
});

const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z.string().trim().min(2).max(80),
  description: z.string().trim().max(4000).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  price: z.coerce.number().int().min(0).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  brand: z.string().trim().max(80).optional(),
  categoryId: z.string().trim().max(80).optional().nullable(),
  available: z.coerce.boolean().default(true)
});

const opportunityCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(180),
  description: z.string().trim().min(2).max(4000),
  requirements: z.array(z.string().trim().min(1).max(300)).default([]),
  benefits: z.array(z.string().trim().min(1).max(300)).default([]),
  status: z.enum(['OPEN', 'CLOSED', 'ARCHIVED']).default('OPEN')
});

const productCategoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80)
});

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
  } else if (resource === 'services') {
    const parsed = serviceCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid service data.' }, { status: 400 });
    created = await db.service.create({ data: parsed.data });
  } else if (resource === 'vehicles') {
    const parsed = vehicleCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid vehicle data.' }, { status: 400 });
    // Optional image URLs (uploaded via /api/admin/upload) become VehicleImage
    // rows in display order, so the public cards and detail views light up.
    const images: string[] = Array.isArray(body.images)
      ? body.images.map((url: unknown) => String(url).trim()).filter(Boolean).slice(0, 8)
      : [];
    created = await db.vehicle.create({
      data: {
        ...parsed.data,
        features: body.features === undefined ? undefined : body.features,
        images: { create: images.map((url, position) => ({ url, position, altText: `${parsed.data.make} ${parsed.data.model}` })) }
      },
      include: { images: true }
    });
  } else if (resource === 'products') {
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid product data.' }, { status: 400 });
    const { categoryId, ...rest } = parsed.data;
    // Auto-create the category when the admin typed a new one instead of
    // picking an existing slug — keeps the catalogue organised effortlessly.
    let resolvedCategoryId: string | null = null;
    if (categoryId) {
      const category = await db.productCategory.upsert({
        where: { slug: categoryId },
        update: {},
        create: { name: categoryId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), slug: categoryId }
      });
      resolvedCategoryId = category.id;
    }
    created = await db.product.create({ data: { ...rest, categoryId: resolvedCategoryId }, include: { category: true } });
  } else if (resource === 'opportunities') {
    const parsed = opportunityCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid opportunity data.' }, { status: 400 });
    created = await db.driverOpportunity.create({ data: { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.title) } });
  } else if (resource === 'product-categories') {
    const parsed = productCategoryCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid category data.' }, { status: 400 });
    try {
      created = await db.productCategory.create({ data: parsed.data });
    } catch {
      return NextResponse.json({ error: 'A category with that name or slug already exists.' }, { status: 409 });
    }
  } else {
    return NextResponse.json({ error: 'Creation is not available for this resource yet.' }, { status: 400 });
  }

  await db.auditLog.create({ data: { userId: user.id, action: 'CREATE', entity: resource, entityId: (created as { id: string }).id } });
  return NextResponse.json(created, { status: 201 });
}

const deletableResources = new Set(['messages', 'subscribers', 'statistics', 'gallery', 'resources', 'team', 'services', 'vehicles', 'rentals', 'products', 'opportunities', 'product-categories']);

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
  else if (resource === 'services') await db.service.delete({ where: { id: id.data } });
  else if (resource === 'vehicles') await db.vehicle.delete({ where: { id: id.data } });
  else if (resource === 'rentals') await db.rentalInquiry.delete({ where: { id: id.data } });
  else if (resource === 'products') await db.product.delete({ where: { id: id.data } });
  else if (resource === 'opportunities') {
    // Keep applications attached to the opportunity for audit — close it
    // instead of deleting when candidates have already applied.
    const applications = await db.driverApplication.count({ where: { opportunityId: id.data } });
    if (applications > 0) return NextResponse.json({ error: 'This opportunity has applications — set it to CLOSED instead of deleting.' }, { status: 409 });
    await db.driverOpportunity.delete({ where: { id: id.data } });
  }
  else if (resource === 'product-categories') {
    const products = await db.product.count({ where: { categoryId: id.data } });
    if (products > 0) return NextResponse.json({ error: `This category still has ${products} product(s) — move them first.` }, { status: 409 });
    await db.productCategory.delete({ where: { id: id.data } });
  }
  else await db.teamMember.delete({ where: { id: id.data } });

  await db.auditLog.create({ data: { userId: user.id, action: 'DELETE', entity: resource, entityId: id.data } });
  return NextResponse.json({ success: true });
}
