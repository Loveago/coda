import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  CarFront,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  Gauge,
  Info,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import MemberWorkPaySubnav from '@/components/MemberWorkPaySubnav';
import MemberMaintenanceForm from '@/components/MemberMaintenanceForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Assigned Vehicle | Work & Pay | Mr Truth Member Portal'
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export default async function MemberWorkPayVehiclePage() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const agreement = await (db as any).workPayAgreement.findFirst({
    where: {
      OR: [
        { memberId: portal.id },
        { driverEmail: portal.email }
      ]
    },
    include: {
      vehicle: { include: { images: true } },
      vehicleAssignments: { orderBy: { handoverDate: 'desc' }, take: 1 },
      conditionReports: { orderBy: { inspectionDate: 'desc' } },
      maintenanceRecords: { orderBy: { serviceDate: 'desc' } }
    }
  });

  if (!agreement) {
    redirect('/member/work-and-pay');
  }

  const vehicle = agreement.vehicle;
  const assignment = agreement.vehicleAssignments[0];
  const maintenance = agreement.maintenanceRecords || [];

  return (
    <main className="mdash">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Assigned Vehicle &amp; Maintenance</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          Operational details, inspection records, roadworthiness, and scheduled servicing for your assigned vehicle.
        </p>
      </div>

      <MemberWorkPaySubnav />

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Vehicle Identity Card */}
        <div className="panel" style={{ padding: 24, borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>
                ASSIGNED FLEET UNIT
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 2px' }}>
                {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Assigned Vehicle'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Agreement: <strong>{agreement.agreementNumber}</strong> · Assigned: {dateFormatter.format(new Date(assignment?.handoverDate || agreement.startDate))}
              </p>
            </div>

            <span className="pill good" style={{ fontSize: 12, padding: '4px 12px' }}>
              OPERATIONAL · ROADWORTHY
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>HANDOVER MILEAGE</span>
              <strong style={{ fontSize: 18, color: '#1e293b' }}>
                {assignment?.handoverMileage ? `${assignment.handoverMileage.toLocaleString()} km` : '38,500 km'}
              </strong>
              <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Recorded at signing</small>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>INSURANCE EXPIRY</span>
              <strong style={{ fontSize: 18, color: '#059669' }}>VALID</strong>
              <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Renewed annually</small>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>NEXT OIL SERVICE</span>
              <strong style={{ fontSize: 18, color: '#2563eb' }}>Due in 2,500 km</strong>
              <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Every 5,000 km standard</small>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>GPS TRACKER</span>
              <strong style={{ fontSize: 18, color: '#10b981' }}>ACTIVE</strong>
              <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>24/7 telematics online</small>
            </div>
          </div>
        </div>

        {/* Maintenance Log & Request Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Maintenance Records */}
          <div className="panel" style={{ padding: 20, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wrench size={18} style={{ color: 'var(--blue)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Service &amp; Maintenance Logs</h2>
            </div>

            {maintenance.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 12.5, textAlign: 'center', padding: '24px 0' }}>
                No maintenance records logged yet. Use the form to record servicing or report a breakdown.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {maintenance.map((m: any) => (
                  <div key={m.id} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12.5, border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{m.serviceType.replace(/_/g, ' ')}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                        {dateFormatter.format(new Date(m.serviceDate))}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 11.5 }}>
                      <span>Paid by: {m.paidBy}</span>
                      <span>Cost: GHS {Number(m.cost).toFixed(2)}</span>
                    </div>
                    {m.notes && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748b' }}>{m.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Issue / Log Maintenance */}
          <div className="panel" style={{ padding: 20 }}>
            <MemberMaintenanceForm agreementId={agreement.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
