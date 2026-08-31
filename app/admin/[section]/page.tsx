import { db } from '@/lib/db';
import AdminManagementTable from '@/components/AdminManagementTable';
import GalleryManager from '@/components/GalleryManager';
import ResourceManager from '@/components/ResourceManager';
import MembersManager from '@/components/MembersManager';
import ProductManager from '@/components/ProductManager';
import VehicleManager from '@/components/VehicleManager';
import OpportunityManager from '@/components/OpportunityManager';
import { APPLICATION_FILTER } from '@/lib/membership';
import { WORK_APPLICATION_FILTER, workApplicationSelect } from '@/lib/work-applications';

const supportedSections = new Set(['applications', 'members', 'messages', 'subscribers', 'gallery', 'resources', 'statistics', 'settings', 'team', 'services', 'vehicles', 'rentals', 'products', 'recruitment', 'work-applications', 'opportunities']);

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
  // Paystack keys are secrets and social links have their own editor — both
  // are managed via their dedicated pages under /admin/settings.
  if (section === 'settings') records = await db.siteSetting.findMany({ where: { AND: [{ key: { not: { startsWith: 'paystack_' } } }, { key: { not: { startsWith: 'social_' } } }] }, orderBy: { key: 'asc' } });
  if (section === 'gallery') records = await db.galleryItem.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] });
  if (section === 'resources') records = await db.resource.findMany({ orderBy: { updatedAt: 'desc' } });
  if (section === 'team') records = await db.teamMember.findMany({ orderBy: { displayOrder: 'asc' } });
  if (section === 'services') records = await db.service.findMany({ orderBy: { displayOrder: 'asc' } });
  if (section === 'vehicles') records = await db.vehicle.findMany({ include: { images: { orderBy: { position: 'asc' } } }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }] });
  if (section === 'rentals') records = await db.rentalInquiry.findMany({ include: { vehicle: { select: { make: true, model: true, year: true } } }, orderBy: { createdAt: 'desc' } });
  if (section === 'products') records = await db.product.findMany({ orderBy: { createdAt: 'desc' } });
  if (section === 'recruitment') records = await db.driverApplication.findMany({ include: { opportunity: { select: { title: true } } }, orderBy: { createdAt: 'desc' } });
  if (section === 'work-applications') records = await db.workApplication.findMany({ where: WORK_APPLICATION_FILTER, select: workApplicationSelect, orderBy: { createdAt: 'desc' } });
  if (section === 'opportunities') records = await db.driverOpportunity.findMany({ include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } });

  const title = section.charAt(0).toUpperCase() + section.slice(1);

  // Vehicles and products have dedicated catalogue managers (image uploads,
  // inline editing, stock controls) instead of the generic table.
  if (section === 'vehicles') {
    return (
      <main>
        <div className="admin-page-head">
          <div>
            <p className="kicker" style={{ color: 'var(--blue)' }}>BUSINESS</p>
            <h1>Vehicles</h1>
          </div>
          <a className="btn btn-ghost" href="/vehicles" target="_blank" rel="noreferrer">VIEW PUBLIC PAGE</a>
        </div>
        <VehicleManager initialVehicles={records as never} />
      </main>
    );
  }
  if (section === 'products') {
    const productCategories = await db.productCategory.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
    return (
      <main>
        <div className="admin-page-head">
          <div>
            <p className="kicker" style={{ color: 'var(--blue)' }}>BUSINESS</p>
            <h1>Automotive Goods</h1>
          </div>
          <a className="btn btn-ghost" href="/automotive" target="_blank" rel="noreferrer">VIEW PUBLIC PAGE</a>
        </div>
        <ProductManager initialProducts={records as never} initialCategories={productCategories as never} />
      </main>
    );
  }

  if (section === 'opportunities') {
    return (
      <main>
        <div className="admin-page-head">
          <div>
            <p className="kicker" style={{ color: 'var(--blue)' }}>BUSINESS</p>
            <h1>Job Postings</h1>
          </div>
          <a className="btn btn-ghost" href="/services/driver-recruitment" target="_blank" rel="noreferrer">VIEW PUBLIC PAGE</a>
        </div>
        <OpportunityManager initialOpportunities={records as never} />
      </main>
    );
  }

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

  const exportLink = section === 'work-applications'
    ? <a className="btn btn-ghost" href="/api/admin/export/work-applications">EXPORT CSV</a>
    : section === 'recruitment'
      ? <a className="btn btn-ghost" href="/api/admin/export/recruitment">EXPORT CSV</a>
      : null;

  return (
    <main>
      <div className="admin-page-head">
        <div><p className="kicker" style={{ color: 'var(--blue)' }}>AGENCY OPERATIONS</p><h1>{title}</h1></div>
        {exportLink}
      </div>
      {section === 'gallery' && <GalleryManager items={records as never} />}
      {section === 'resources' && <ResourceManager items={records as never} />}
      {section !== 'gallery' && section !== 'resources' && <AdminManagementTable resource={section} records={records} />}
    </main>
  );
}
