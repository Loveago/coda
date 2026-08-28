import { db } from '@/lib/db';
import AdminManagementTable from '@/components/AdminManagementTable';
import GalleryManager from '@/components/GalleryManager';
import ResourceManager from '@/components/ResourceManager';
import MembersManager from '@/components/MembersManager';
import { APPLICATION_FILTER } from '@/lib/membership';

const supportedSections = new Set(['applications', 'members', 'messages', 'subscribers', 'gallery', 'resources', 'statistics', 'settings', 'team']);

const memberSelect = {
  id: true, firstName: true, lastName: true, email: true, phone: true, platform: true,
  vehicleInfo: true, location: true, status: true, registrationPayment: true,
  membershipEndDate: true, internalNotes: true, createdAt: true
} as const;

export const dynamic = 'force-dynamic';

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!supportedSections.has(section)) {
    return <main><h1>Management area not found</h1><p>This admin section does not exist.</p></main>;
  }

  let records: Array<{ id: string; [key: string]: unknown }> = [];
  if (section === 'applications') records = await db.member.findMany({ where: APPLICATION_FILTER, select: memberSelect, orderBy: { createdAt: 'desc' } });
  if (section === 'messages') records = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  if (section === 'subscribers') records = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  if (section === 'statistics') records = await db.statistic.findMany({ orderBy: { displayOrder: 'asc' } });
  // Paystack keys are secrets – they are only managed via /admin/settings/paystack.
  if (section === 'settings') records = await db.siteSetting.findMany({ where: { key: { not: { startsWith: 'paystack_' } } }, orderBy: { key: 'asc' } });
  if (section === 'gallery') records = await db.galleryItem.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] });
  if (section === 'resources') records = await db.resource.findMany({ orderBy: { updatedAt: 'desc' } });
  if (section === 'team') records = await db.teamMember.findMany({ orderBy: { displayOrder: 'asc' } });

  const title = section.charAt(0).toUpperCase() + section.slice(1);
  // The members area has a dedicated manager (search, dues filters, manual
  // renewals, deletion) that loads its own data client-side.
  if (section === 'members') {
    return (
      <main>
        <div className="admin-page-head">
          <div>
            <p className="kicker" style={{ color: 'var(--blue)' }}>COMMUNITY</p>
            <h1>Members</h1>
          </div>
          <a className="btn btn-ghost" href="/api/admin/export/members">EXPORT CSV</a>
        </div>
        <MembersManager />
      </main>
    );
  }

  return (
    <main>
      <div className="admin-page-head">
        <div><p className="kicker" style={{ color: 'var(--blue)' }}>CMS MANAGEMENT</p><h1>{title}</h1></div>
      </div>
      {section === 'gallery' && <GalleryManager items={records as never} />}
      {section === 'resources' && <ResourceManager items={records as never} />}
      {section !== 'gallery' && section !== 'resources' && <AdminManagementTable resource={section} records={records} />}
    </main>
  );
}
