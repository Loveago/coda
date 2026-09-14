import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileCheck2,
  FileText,
  Plus,
  ShieldAlert,
  Users,
  Wrench
} from 'lucide-react';
import { db } from '@/lib/db';
import AdminWorkPaySubnav from '@/components/AdminWorkPaySubnav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Work & Pay Overview | Mr Truth Agency Admin'
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export default async function AdminWorkPayOverviewPage() {
  const [
    agreements,
    applicationsCount,
    pendingAppsCount,
    vehiclesCount,
    assignedVehiclesCount,
    recentPayments,
    overdueInstallments
  ] = await Promise.all([
    (db as any).workPayAgreement.findMany({
      include: {
        vehicle: true,
        installments: true
      }
    }),
    (db as any).workPayApplication.count(),
    (db as any).workPayApplication.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED'] } } }),
    db.vehicle.count(),
    (db as any).workPayAgreement.count({ where: { status: { in: ['ACTIVE', 'IN_ARREARS'] } } }),
    (db as any).workPayPayment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 6,
      include: { agreement: { include: { vehicle: true } } }
    }),
    (db as any).workPayInstallment.findMany({
      where: { status: 'OVERDUE' },
      include: { agreement: true }
    })
  ]);

  const activeAgreements = agreements.filter((a: any) => a.status === 'ACTIVE' || a.status === 'IN_ARREARS');
  const totalCollected = agreements.reduce((acc: number, a: any) => acc + Number(a.totalPaid || 0), 0);
  const totalArrears = overdueInstallments.reduce((acc: number, i: any) => acc + (Number(i.targetAmount) - Number(i.amountPaid || 0)), 0);

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>VEHICLE OWNERSHIP &amp; FLEET FINANCING</p>
          <h1>Work &amp; Pay Management Suite</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Executive oversight of Ghana commercial vehicle ownership agreements, weekly remittances, driver vetting, and DVLA title transfers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/work-and-pay/agreements?create=true" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> NEW AGREEMENT
          </Link>
          <Link href="/admin/work-and-pay/payments?record=true" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CreditCard size={15} /> RECORD PAYMENT
          </Link>
        </div>
      </div>

      <AdminWorkPaySubnav />

      {/* 5 Core KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="panel" style={{ padding: 18, borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px' }}>ACTIVE CONTRACTS</span>
            <FileText size={18} style={{ color: 'var(--blue)' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 2px' }}>{activeAgreements.length}</h2>
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>{agreements.length} total historical contracts</small>
        </div>

        <div className="panel" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px' }}>TOTAL REVENUE COLLECTED</span>
            <DollarSign size={18} style={{ color: '#10b981' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 2px', color: '#059669' }}>
            GHS {totalCollected.toLocaleString()}
          </h2>
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>Principal credited to fleet buyout</small>
        </div>

        <div className="panel" style={{ padding: 18, borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px' }}>TOTAL OVERDUE ARREARS</span>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 2px', color: '#dc2626' }}>
            GHS {totalArrears.toLocaleString()}
          </h2>
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>{overdueInstallments.length} delinquent installment weeks</small>
        </div>

        <div className="panel" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px' }}>APPLICATIONS PIPELINE</span>
            <Users size={18} style={{ color: '#f59e0b' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 2px' }}>{pendingAppsCount}</h2>
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>{applicationsCount} total driver submissions</small>
        </div>

        <div className="panel" style={{ padding: 18, borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px' }}>FLEET DEPLOYMENT</span>
            <CarFront size={18} style={{ color: '#8b5cf6' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 2px' }}>
            {assignedVehiclesCount} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>/ {vehiclesCount}</span>
          </h2>
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>Assigned to active contracts</small>
        </div>
      </div>

      {/* Arrears Attention Banner if delinquent accounts exist */}
      {overdueInstallments.length > 0 && (
        <div style={{ padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldAlert size={24} style={{ color: '#dc2626' }} />
            <div>
              <strong style={{ fontSize: 14, color: '#991b1b' }}>
                Delinquent Accounts Alert: {overdueInstallments.length} installments past grace period
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#b91c1c' }}>
                Total overdue balance: GHS {totalArrears.toLocaleString()}. Monitor delinquent accounts or dispatch driver notices.
              </p>
            </div>
          </div>
          <Link href="/admin/work-and-pay/arrears" className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#b91c1c', fontSize: 12 }}>
            VIEW ARREARS MONITOR →
          </Link>
        </div>
      )}

      {/* Main Grid: Recent Payments & Active Contracts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Recent Payments Stream */}
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Latest Remittance Transactions</h3>
            <Link href="/admin/work-and-pay/payments" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
              Full Ledger →
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              No payments recorded yet.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {recentPayments.map((p: any) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    fontSize: 12.5
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, display: 'block' }}>GHS {Number(p.amount).toFixed(2)}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {p.agreement?.driverName || 'Driver'} · {p.channelDetails || p.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="pill good" style={{ fontSize: 9, padding: '2px 6px' }}>{p.status}</span>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: 10.5, marginTop: 2 }}>
                      {dateFormatter.format(new Date(p.paymentDate))}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Agreements Summary */}
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Active Fleet Contracts</h3>
            <Link href="/admin/work-and-pay/agreements" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
              All Agreements →
            </Link>
          </div>

          {activeAgreements.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              No active Work &amp; Pay contracts. Create an agreement to assign vehicles to vetted drivers.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {activeAgreements.slice(0, 5).map((a: any) => {
                const total = Number(a.totalPrice);
                const paid = Number(a.totalPaid || 0);
                const pct = Math.min(100, Math.round((paid / total) * 100));

                return (
                  <Link
                    key={a.id}
                    href={`/admin/work-and-pay/agreements/${a.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'grid',
                      gap: 4,
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 6,
                      border: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13 }}>{a.driverName}</strong>
                      <span className={`pill ${a.status === 'IN_ARREARS' ? 'bad' : 'good'}`} style={{ fontSize: 9, padding: '2px 6px' }}>
                        {a.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)' }}>
                      <span>{a.vehicle?.make} {a.vehicle?.model} ({a.agreementNumber})</span>
                      <span>{pct}% Paid (GHS {paid.toLocaleString()} / {total.toLocaleString()})</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#e2e8f0', marginTop: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: a.status === 'IN_ARREARS' ? '#ef4444' : '#2563eb' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
