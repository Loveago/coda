import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminAgreementDetailClient from '@/components/AdminAgreementDetailClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Agreement Details | Work & Pay | Mr Truth Agency Admin'
};

export default async function AdminAgreementDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const resolvedParams = await params;
  const agreement = await (db as any).workPayAgreement.findUnique({
    where: { id: resolvedParams.id },
    include: {
      vehicle: true,
      member: true,
      application: true,
      installments: { orderBy: { weekNumber: 'asc' } },
      payments: { orderBy: { paymentDate: 'desc' } },
      vehicleAssignments: true,
      securityDeposits: true,
      maintenanceRecords: { orderBy: { serviceDate: 'desc' } },
      ownershipTransfer: true,
      auditLogs: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }
    }
  });

  if (!agreement) notFound();

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>CONTRACT ADMINISTRATION</p>
          <h1>Agreement {agreement.agreementNumber}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Driver: {agreement.driverName} · Vehicle: {agreement.vehicle ? `${agreement.vehicle.year} ${agreement.vehicle.make} ${agreement.vehicle.model}` : 'Assigned Fleet'}
          </p>
        </div>
      </div>

      <AdminWorkPaySubnav />

      <AdminAgreementDetailClient agreement={agreement} />
    </main>
  );
}
