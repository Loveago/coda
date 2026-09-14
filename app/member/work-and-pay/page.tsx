import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Calendar,
  CarFront,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Gauge,
  HelpCircle,
  History,
  Info,
  KeyRound,
  Percent,
  PlusCircle,
  Repeat,
  Shield,
  ShieldCheck,
  Sparkles,
  Wrench
} from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import MemberWorkPaySubnav from '@/components/MemberWorkPaySubnav';
import WorkPayPaymentButton from '@/components/WorkPayPaymentButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Work & Pay Dashboard | Mr Truth Member Portal'
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export default async function MemberWorkPayDashboard({
  searchParams
}: {
  searchParams?: Promise<{ payment?: string; ref?: string }>;
}) {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const [agreement, application] = await Promise.all([
    (db as any).workPayAgreement.findFirst({
      where: {
        OR: [
          { memberId: portal.id },
          { driverEmail: portal.email }
        ]
      },
      include: {
        vehicle: { include: { images: true } },
        installments: { orderBy: { weekNumber: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' }, take: 5 },
        maintenanceRecords: { orderBy: { serviceDate: 'desc' }, take: 2 }
      }
    }),
    (db as any).workPayApplication.findFirst({
      where: {
        OR: [
          { memberId: portal.id },
          { email: portal.email }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const params = searchParams ? await searchParams : {};
  const isPaymentSuccess = params.payment === 'success';

  return (
    <main className="mdash">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Work &amp; Pay Ownership Program</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          Manage your vehicle financing contract, weekly remittances, maintenance logs, and DVLA ownership transfer.
        </p>
      </div>

      <MemberWorkPaySubnav />

      {isPaymentSuccess && (
        <div style={{ padding: '14px 18px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#065f46' }}>
          <BadgeCheck size={20} />
          <div>
            <strong>Payment Confirmed!</strong>
            <p style={{ margin: 0, fontSize: 12 }}>Your weekly installment has been verified and allocated toward your vehicle purchase target.</p>
          </div>
        </div>
      )}

      {/* CASE 1: Active or Enrolled Agreement */}
      {agreement ? (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Top Key Metrics Banner */}
          {(() => {
            const totalPrice = Number(agreement.totalPrice);
            const totalPaid = Number(agreement.totalPaid || 0);
            const balance = Number(agreement.remainingBalance || totalPrice - totalPaid);
            const progressPct = Math.min(100, Math.round((totalPaid / totalPrice) * 100));

            const totalWeeks = agreement.durationWeeks || 104;
            const paidWeeks = agreement.installments.filter((i: any) => i.status === 'PAID').length;
            const weeksRemaining = Math.max(0, totalWeeks - paidWeeks);

            // Find upcoming / current week installment
            const unpaidInstallment = agreement.installments.find((i: any) => i.status === 'PENDING' || i.status === 'OVERDUE' || i.status === 'PARTIAL');
            const isOverdue = unpaidInstallment?.status === 'OVERDUE' || agreement.status === 'IN_ARREARS';

            const vehicle = agreement.vehicle;

            return (
              <>
                {!agreement.driverSignature && (
                  <div style={{
                    padding: '14px 18px',
                    background: '#fffbeb',
                    borderRadius: 8,
                    border: '1px solid #fde68a',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    color: '#92400e'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AlertCircle size={20} style={{ color: '#d97706' }} />
                      <div>
                        <strong style={{ fontSize: 14 }}>Signature Required on Your Official Agreement</strong>
                        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#b45309' }}>
                          Please review and digitally sign your Work &amp; Pay agreement to finalize contract activation.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/member/work-and-pay/contract"
                      className="btn btn-primary"
                      style={{ fontSize: 12, padding: '8px 16px', background: '#d97706', borderColor: '#d97706' }}
                    >
                      Review &amp; Sign Contract
                    </Link>
                  </div>
                )}

                {/* Status Hero Card */}
                <div className="panel" style={{ padding: 24, borderTop: `4px solid ${isOverdue ? '#ef4444' : '#2563eb'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>
                        CONTRACT {agreement.agreementNumber}
                      </span>
                      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0' }}>
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Assigned Vehicle'}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Link
                        href="/member/work-and-pay/contract"
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <FileText size={14} /> Legal Contract
                      </Link>

                      <span className={`pill ${isOverdue ? 'bad' : agreement.status === 'COMPLETED' ? 'good' : 'tone-blue'}`} style={{ fontSize: 12, padding: '4px 12px' }}>
                        {agreement.status.replace(/_/g, ' ')}
                      </span>
                      {agreement.status !== 'COMPLETED' && (
                        <WorkPayPaymentButton
                          agreementId={agreement.id}
                          weeklyAmount={Number(agreement.weeklyPayment)}
                          defaultAmount={unpaidInstallment ? Number(unpaidInstallment.targetAmount) - Number(unpaidInstallment.amountPaid || 0) : Number(agreement.weeklyPayment)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Ownership Progress Bar */}
                  <div style={{ margin: '14px 0 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span>
                        Ownership Progress: <strong style={{ color: '#059669' }}>GHS {totalPaid.toLocaleString()}</strong> of GHS {totalPrice.toLocaleString()}
                      </span>
                      <strong style={{ color: 'var(--blue)' }}>{progressPct}% Paid</strong>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: '#e2e8f0', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progressPct}%`,
                          background: 'linear-gradient(90deg, #2563eb, #10b981)',
                          borderRadius: 5,
                          transition: 'width .4s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* 4 Core Stat Tiles */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>REMAINING BALANCE</span>
                      <strong style={{ fontSize: 18, color: '#1e293b' }}>GHS {balance.toLocaleString()}</strong>
                      <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Target payoff amount</small>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>WEEKS REMAINING</span>
                      <strong style={{ fontSize: 18, color: '#2563eb' }}>{weeksRemaining} of {totalWeeks}</strong>
                      <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>{paidWeeks} weeks completed</small>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>WEEKLY REMITTANCE</span>
                      <strong style={{ fontSize: 18, color: '#1e293b' }}>GHS {Number(agreement.weeklyPayment).toLocaleString()}</strong>
                      <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Due every week</small>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>CURRENT WEEK STATUS</span>
                      {isOverdue ? (
                        <strong style={{ fontSize: 18, color: '#dc2626' }}>OVERDUE</strong>
                      ) : unpaidInstallment ? (
                        <strong style={{ fontSize: 18, color: '#d97706' }}>
                          DUE {dateFormatter.format(new Date(unpaidInstallment.dueDate))}
                        </strong>
                      ) : (
                        <strong style={{ fontSize: 18, color: '#16a34a' }}>PAID UP</strong>
                      )}
                      <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>
                        {unpaidInstallment ? `Week #${unpaidInstallment.weekNumber}` : 'All up to date'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Duo Grid: Assigned Vehicle Details + Recent Payments */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  {/* Vehicle Card */}
                  <div className="panel" style={{ padding: 20, display: 'grid', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CarFront size={18} style={{ color: 'var(--blue)' }} />
                        <strong style={{ fontSize: 15 }}>Vehicle Information</strong>
                      </div>
                      <Link href="/member/work-and-pay/vehicle" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                        View Full Details →
                      </Link>
                    </div>

                    <div style={{ display: 'grid', gap: 10, fontSize: 12.5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--muted)' }}>Vehicle Model</span>
                        <strong>{vehicle?.make} {vehicle?.model} ({vehicle?.year})</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--muted)' }}>Registration Number</span>
                        <strong style={{ letterSpacing: '1px' }}>{vehicle?.id ? `GR-5120-22` : 'ASSIGNED'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--muted)' }}>Category / Fuel</span>
                        <span>{vehicle?.category || 'Sedan'} · {vehicle?.fuelType || 'Petrol'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--muted)' }}>Insurance Expiry</span>
                        <span className="pill good" style={{ fontSize: 10, padding: '2px 8px' }}>Valid · Active</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Roadworthiness Cert.</span>
                        <span className="pill good" style={{ fontSize: 10, padding: '2px 8px' }}>Valid · DVLA Inspected</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Payments Card */}
                  <div className="panel" style={{ padding: 20, display: 'grid', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <History size={18} style={{ color: 'var(--blue)' }} />
                        <strong style={{ fontSize: 15 }}>Recent Remittances</strong>
                      </div>
                      <Link href="/member/work-and-pay/payments" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                        All Payments →
                      </Link>
                    </div>

                    {agreement.payments.length === 0 ? (
                      <p style={{ color: 'var(--muted)', fontSize: 12.5, textAlign: 'center', padding: '24px 0' }}>
                        No payments recorded yet. Make your first weekly remittance to start building equity!
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {agreement.payments.map((p: any) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: '#f8fafc',
                              borderRadius: 6,
                              fontSize: 12
                            }}
                          >
                            <div>
                              <strong style={{ display: 'block', fontSize: 12.5 }}>GHS {Number(p.amount).toFixed(2)}</strong>
                              <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                                {dateFormatter.format(new Date(p.paymentDate))} · {p.paymentMethod.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <Link
                              href={`/member/work-and-pay/payments/${p.id}/receipt`}
                              className="btn btn-ghost"
                              style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Download size={12} /> Receipt
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : application ? (
        /* CASE 2: Application submitted or pending interview */
        <div className="panel" style={{ padding: 28, display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>
                WORK &amp; PAY APPLICATION
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 0' }}>{application.applicationNumber}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                Vehicle Preference: <strong>{application.preferredVehicleType}</strong> · Region: {application.operatingRegion}
              </p>
            </div>
            <span className="pill good" style={{ fontSize: 12, padding: '4px 12px' }}>
              {application.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ padding: 18, background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Application Status Update:</p>
            {application.status === 'SUBMITTED' && (
              <p style={{ margin: 0 }}>
                Your application has been received and is currently undergoing initial document screening. Our vetting officer will contact you to schedule an interview.
              </p>
            )}
            {application.status === 'UNDER_REVIEW' && (
              <p style={{ margin: 0 }}>
                Your background check and license verification are currently in progress.
              </p>
            )}
            {application.status === 'INTERVIEW_SCHEDULED' && (
              <p style={{ margin: 0 }}>
                Your in-person interview has been scheduled for{' '}
                <strong>{application.interviewDate ? new Date(application.interviewDate).toLocaleString('en-GB') : 'soon'}</strong>.
                Please report to our Accra office with original copies of your Ghana Card, driver’s license, and utility bill.
              </p>
            )}
            {application.status === 'APPROVED' && (
              <p style={{ margin: 0 }}>
                🎉 Congratulations! Your Work &amp; Pay application has been approved. Our operations team is preparing your vehicle assignment and contract.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* CASE 3: Not yet applied */
        <div className="panel" style={{ padding: 36, textAlign: 'center', display: 'grid', gap: 16, justifyItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CarFront size={28} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800 }}>Start Your Journey to Vehicle Ownership</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
              You are not currently enrolled in a Work &amp; Pay agreement. As an approved member of Mr Truth Agency, you qualify for priority commercial vehicle financing.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/work-and-pay/apply" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 13 }}>
              APPLY FOR WORK &amp; PAY VEHICLE →
            </Link>
            <Link href="/work-and-pay" className="btn btn-ghost" style={{ padding: '12px 20px', fontSize: 13 }}>
              VIEW VEHICLES &amp; TERMS
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
