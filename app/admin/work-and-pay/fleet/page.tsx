import type { Metadata } from 'next';
import { db } from '@/lib/db';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';
import AdminWorkPayFleetManager from '@/components/AdminWorkPayFleetManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fleet & Vehicle Management | Work & Pay | Admin Portal'
};

export default async function AdminWorkPayFleetPage() {
  const vehicles = await (db.vehicle as any).findMany({
    include: {
      images: { orderBy: { position: 'asc' } },
      workPayAgreements: {
        select: {
          id: true,
          agreementNumber: true,
          driverName: true,
          status: true,
          startDate: true
        }
      },
      _count: {
        select: {
          workPayApplications: true,
          workPayAgreements: true
        }
      }
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
  });

  const serialized = JSON.parse(JSON.stringify(vehicles));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Fleet &amp; Vehicle Management</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          Manage commercial fleet vehicles, onboard private investor cars, and configure Work &amp; Pay vs Daily Sales operating terms.
        </p>
      </div>

      <AdminWorkPaySubnav />

      <AdminWorkPayFleetManager initialVehicles={serialized} />
    </div>
  );
}
