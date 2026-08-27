import { db } from '@/lib/db';
import AdminManagementTable from '@/components/AdminManagementTable';
import GalleryManager from '@/components/GalleryManager';
import ResourceManager from '@/components/ResourceManager';

const supportedSections = new Set(['members', 'messages', 'subscribers', 'gallery', 'resources', 'statistics', 'settings', 'team']);

export const dynamic = 'force-dynamic';

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!supportedSections.has(section)) {
    return <main><h1>Management area not found</h1><p>This admin section does not exist.</p></main>;
  }

  let records: Array<{ id: string; [key: string]: unknown }> = [];
  if (section === 'members') records = await db.membershipApplication.findMany({ orderBy: { createdAt: 'desc' } });
  if (section === 'messages') records = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  if (section === 'subscribers') records = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  if (section === 'statistics') records = await db.statistic.findMany({ orderBy: { displayOrder: 'asc' } });
  // Paystack keys are secrets – they are only managed via /admin/settings/paystack.
  if (section === 'settings') records = await db.siteSetting.findMany({ where: { key: { not: { startsWith: 'paystack_' } } }, orderBy: { key: 'asc' } });
  if (section === 'gallery') records = await db.galleryItem.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] });
  if (section === 'resources') records = await db.resource.findMany({ orderBy: { updatedAt: 'desc' } });
  if (section === 'team') records = await db.teamMember.findMany({ orderBy: { displayOrder: 'asc' } });

  const title = section.charAt(0).toUpperCase() + section.slice(1);
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
