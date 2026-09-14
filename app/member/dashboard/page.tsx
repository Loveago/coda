import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CarFront,
  Check,
  CreditCard,
  Download,
  Home,
  IdCard,
  KeyRound,
  MapPin,
  PartyPopper,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound
} from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { calculateAnnualDuesStatus, getFeeSettings } from '@/lib/fees';
import Reveal from '@/components/Reveal';
import PayDuesButton from '@/components/PayDuesButton';

export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export default async function MemberDashboard({
  searchParams
}: {
  searchParams?: Promise<{ payment?: string; type?: string }>;
}) {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const [feeSettings, member, openRoles, successfulPayments, workPayAgreement] = await Promise.all([
    getFeeSettings(),
    db.member.findUnique({ where: { id: portal.id } }),
    db.driverOpportunity.count({ where: { status: 'OPEN' } }),
    db.payment.findMany({ where: { memberId: portal.id, status: 'SUCCESSFUL' } }),
    (db as any).workPayAgreement.findFirst({
      where: {
        memberId: portal.id,
        status: { in: ['ACTIVE', 'IN_ARREARS', 'PENDING_SIGNATURE', 'COMPLETED'] }
      },
      include: { vehicle: true }
    }).catch(() => null)
  ]);

  if (!member) redirect('/login');

  const duesStatus = calculateAnnualDuesStatus(
    member.membershipEndDate,
    member.membershipStartDate,
    feeSettings.annualDues
  );

  const duesGhs = feeSettings.annualDues.amount / 100;
  const regGhs = feeSettings.registration.amount / 100;
  const totalPaidGhs = (successfulPayments.reduce((acc, p) => acc + p.amount, 0) / 100).toFixed(2);

  const resolvedParams = searchParams ? await searchParams : {};
  const isPaymentSuccess = resolvedParams.payment === 'success';

  // PENDING applicants
  if (member.status === 'PENDING') {
    const isRegFeePending = feeSettings.registration.enabled && member.registrationPayment === 'PENDING';

    return (
      <main className="mdash">
        <section className="mwelcome">
          <div>
            <h1>Welcome, {member.firstName} 👋</h1>
            <p>Member ID: <span className="mwelcome-id">{member.memberNumber}</span></p>
          </div>
          <span className={`mdash-pill ${isRegFeePending ? 'tone-warn' : 'tone-good'}`} style={{ alignSelf: 'center' }}>
            {isRegFeePending ? 'PAYMENT REQUIRED' : 'APPLICATION SUBMITTED'}
          </span>
        </section>

        {isPaymentSuccess && (
          <div style={{ padding: '14px 18px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#065f46' }}>
            <BadgeCheck size={20} />
            <div>
              <strong>Payment received successfully!</strong>
              <p style={{ margin: 0, fontSize: 12 }}>Your membership payment has been verified. Welcome to Mr Truth Agency!</p>
            </div>
          </div>
        )}

        <Reveal as="section" className={`renew-banner ${isRegFeePending ? 'warn' : 'good'}`}>
          <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
            <h2>{isRegFeePending ? 'Complete Registration Payment' : 'Your application is with our team'}</h2>
            <p>
              {isRegFeePending
                ? `A one-time registration fee of GHS ${regGhs.toFixed(2)} is required to activate your membership and unlock the digital ID card, job board, and vehicle programs.`
                : feeSettings.registration.enabled
                  ? 'Your registration fee has been received and your profile is being reviewed by the membership committee.'
                  : 'Membership with Mr Truth Agency is completely free. Your application has been submitted and is being processed by the membership committee.'}
            </p>

            {isRegFeePending && (
              <div style={{ marginTop: 14 }}>
                <a
                  href={`/api/payments/paystack/initialize`}
                  onClick={async (e) => {
                    e.preventDefault();
                    const res = await fetch('/api/payments/paystack/initialize', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ paymentType: 'REGISTRATION_FEE', memberId: member.id })
                    });
                    const d = await res.json();
                    if (d.authorization_url) window.location.href = d.authorization_url;
                  }}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <CreditCard size={16} />
                  PAY REGISTRATION FEE (GHS {regGhs.toFixed(2)})
                </a>
              </div>
            )}
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10, justifyItems: 'start' }}>
            <Link href="/membership-status" className="admin-link">CHECK STATUS ANYTIME →</Link>
          </div>
        </Reveal>
      </main>
    );
  }

  if (member.status === 'REJECTED') redirect('/member/profile');

  const timeline = [
    { label: 'Registered', date: dateFormatter.format(member.createdAt), state: 'done' as const },
    { label: 'Approved', date: member.status === 'APPROVED' ? dateFormatter.format(member.updatedAt) : '—', state: 'done' as const },
    {
      label: 'Annual Dues',
      date: !feeSettings.annualDues.enabled
        ? 'Waived (Free)'
        : duesStatus.state === 'CURRENT'
          ? `Current · ${duesStatus.dueDate ? dateFormatter.format(duesStatus.dueDate) : 'Active'}`
          : duesStatus.state === 'DUE_SOON'
            ? `Due Soon (${duesStatus.daysRemaining} days)`
            : 'Overdue',
      state: duesStatus.state === 'OVERDUE' ? ('current' as const) : ('done' as const)
    },
    { label: 'Digital ID Card', date: 'Ready', state: 'done' as const }
  ];

  return (
    <main className="mdash">
      {/* Payment Success Toast Banner */}
      {isPaymentSuccess && (
        <div style={{ padding: '14px 18px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#065f46' }}>
          <BadgeCheck size={20} />
          <div>
            <strong>Payment Confirmed!</strong>
            <p style={{ margin: 0, fontSize: 12 }}>Your Paystack transaction was verified. Your dues and membership status have been updated.</p>
          </div>
        </div>
      )}

      {/* ===== Welcome + ID card ===== */}
      <section className="mwelcome">
        <div>
          <h1>Welcome back,<br />{member.firstName} {member.lastName} 👋</h1>
          <p>Member ID: <span className="mwelcome-id">{member.memberNumber}</span></p>
        </div>
        <Link href="/member/id-card" className="mwelcome-card" aria-label="Open your digital ID card">
          <div className="idcard-face idcard-front" aria-hidden>
            <span className="idcard-band" />
            <div className="idcard-head">
              <img src="/logo-mark.png" alt="" className="idcard-logo" width={30} height={30} />
              <div>
                <strong>MR TRUTH</strong>
                <small>AGENCY MEMBER</small>
              </div>
              <span className="idcard-valid-tag">MEMBER</span>
            </div>
            <div className="idcard-mid">
              <div>
                <p className="idcard-number" style={{ margin: 0 }}>{member.memberNumber}</p>
                <span className="idcard-platform"><Sparkles size={9} /> {member.location || 'ACCRA · GHANA'}</span>
              </div>
            </div>
            <div className="idcard-bottom">
              <div className="idcard-thru">
                <small>ANNUAL DUES</small>
                <strong>{duesStatus.label}</strong>
              </div>
              <span className={`idcard-status-pill ${duesStatus.state === 'OVERDUE' ? 'bad' : 'good'}`}>
                {member.status}
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* ===== Annual Dues Alert Banner if Due Soon or Overdue ===== */}
      {duesStatus.canPay && (
        <Reveal
          as="section"
          className={`renew-banner ${duesStatus.state === 'OVERDUE' ? 'danger' : 'warn'}`}
          style={{ marginBottom: 20 }}
        >
          <div style={{ flex: 1, minWidth: 240, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {duesStatus.state === 'OVERDUE' ? <ShieldAlert size={20} /> : <AlertCircle size={20} />}
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Annual Membership Dues {duesStatus.isGracePeriod ? '— Grace Period Active' : duesStatus.state === 'OVERDUE' ? '— Payment Overdue' : '— Due Soon'}
              </h2>
            </div>
            <p style={{ margin: '6px 0 12px', fontSize: 13, lineHeight: 1.5 }}>
              {duesStatus.message} Annual dues of GHS {duesGhs.toFixed(2)} can be paid securely via Mobile Money or Card.
            </p>
            <PayDuesButton amountGhs={duesGhs} memberId={member.id} />
          </div>
        </Reveal>
      )}

      {/* ===== Stat tiles ===== */}
      <section className="mstat-tiles">
        <Reveal className="mstat">
          <span className="mstat-icon tone-blue"><BadgeCheck size={21} /></span>
          <div>
            <small>Membership Status</small>
            <strong className="tone-green">{member.status}</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Official Agency Member</span>
          </div>
        </Reveal>

        {/* Dues Status Tile */}
        <Reveal className="mstat" delay={60}>
          <span className={`mstat-icon ${duesStatus.state === 'OVERDUE' ? 'tone-warn' : 'tone-blue'}`}>
            <CreditCard size={21} />
          </span>
          <div>
            <small>Annual Dues Status</small>
            <strong className={duesStatus.state === 'OVERDUE' ? 'tone-warn' : 'tone-green'}>
              {duesStatus.label}
            </strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              {!feeSettings.annualDues.enabled
                ? 'Waived by agency policy'
                : duesStatus.dueDate
                  ? `Due: ${dateFormatter.format(duesStatus.dueDate)}`
                  : `GHS ${duesGhs.toFixed(2)} / year`}
            </span>
          </div>
        </Reveal>

        {/* Work & Pay Tile */}
        <Reveal className="mstat" delay={120}>
          <span className="mstat-icon tone-blue"><CarFront size={21} /></span>
          <div>
            <small>Work &amp; Pay Ownership</small>
            {workPayAgreement ? (
              <>
                <strong className="tone-green">{workPayAgreement.status}</strong>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                  {workPayAgreement.vehicle ? `${workPayAgreement.vehicle.make} ${workPayAgreement.vehicle.model}` : 'Active Agreement'}
                </span>
              </>
            ) : (
              <>
                <strong>AVAILABLE</strong>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Apply for vehicle ownership</span>
              </>
            )}
          </div>
        </Reveal>

        {/* Total Payments */}
        <Reveal className="mstat" delay={180}>
          <span className="mstat-icon tone-blue"><Sparkles size={21} /></span>
          <div>
            <small>Total Fees Paid</small>
            <strong className="tone-green">GHS {totalPaidGhs}</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              {successfulPayments.length} successful payment{successfulPayments.length === 1 ? '' : 's'}
            </span>
          </div>
        </Reveal>
      </section>

      {/* ===== Work & Pay Active Progress Card (If enrolled) ===== */}
      {workPayAgreement && (
        <Reveal as="section" className="panel" style={{ marginBottom: 24, borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>
                WORK &amp; PAY VEHICLE PROGRAM
              </span>
              <h2 style={{ margin: '2px 0 0', fontSize: 18 }}>
                {workPayAgreement.vehicle ? `${workPayAgreement.vehicle.year} ${workPayAgreement.vehicle.make} ${workPayAgreement.vehicle.model}` : 'Vehicle Ownership Contract'}
              </h2>
            </div>
            <Link href="/member/work-and-pay" className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>
              MANAGE VEHICLE &amp; PAYMENTS →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 12.5 }}>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block' }}>Contract Total</span>
              <strong>GHS {Number(workPayAgreement.totalPrice).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block' }}>Paid to Date</span>
              <strong style={{ color: '#059669' }}>GHS {Number(workPayAgreement.totalPaid || 0).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block' }}>Remaining Balance</span>
              <strong style={{ color: '#2563eb' }}>GHS {Number(workPayAgreement.remainingBalance || 0).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block' }}>Weekly Remittance</span>
              <strong>GHS {Number(workPayAgreement.weeklyPayment).toLocaleString()} / wk</strong>
            </div>
          </div>
        </Reveal>
      )}

      {/* ===== Membership overview timeline ===== */}
      <Reveal as="section" className="moverview">
        <h2>Membership Overview</h2>
        <div className="mtimeline">
          {timeline.map((step) => (
            <div key={step.label} className={`mtimeline-step ${step.state}`}>
              <span className="mtimeline-dot">{step.state === 'done' ? <Check size={15} /> : <CalendarDays size={14} />}</span>
              <strong>{step.label}</strong>
              <span>{step.date}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ===== Quick actions + upcoming ===== */}
      <div className="mduo">
        <Reveal className="admin-panel">
          <h2>Quick Actions</h2>
          <div className="mqa-grid">
            <Link className="mqa" href="/member/work-and-pay">
              <CarFront size={20} />
              <span>Work &amp; Pay<small>Vehicle financing &amp; tracking</small></span>
            </Link>
            <Link className="mqa" href="/member/work">
              <Briefcase size={20} />
              <span>Apply for Work<small>Jobs across every industry</small></span>
            </Link>
            <Link className="mqa" href="/member/id-card">
              <Download size={20} />
              <span>Download ID Card<small>View or print your card</small></span>
            </Link>
            <Link className="mqa" href="/member/profile">
              <UserRound size={20} />
              <span>Update Profile<small>Edit your information</small></span>
            </Link>
          </div>
        </Reveal>

        <Reveal className="admin-panel" delay={80}>
          <h2>Upcoming <Link href="/news">View all</Link></h2>
          <div className="mup-item">
            <PartyPopper size={18} />
            <div>
              <time>Monthly · First Saturday</time>
              <strong>Exclusive Member Event</strong>
              <small>Meet &amp; greet with the Mr Truth community — Accra, Ghana.</small>
            </div>
          </div>
          <div className="mup-item">
            <MapPin size={18} />
            <div>
              <time>Always open</time>
              <strong>Partner Discounts</strong>
              <small>Active members save at partner garages, wash bays and fuel stops.</small>
            </div>
          </div>
          <div className="mup-item">
            <CarFront size={18} />
            <div>
              <time>Work &amp; Pay Intake</time>
              <strong>New Fleet Additions</strong>
              <small>Vitz, Yaris and Swift units added weekly for qualified drivers.</small>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ===== Explore ===== */}
      <Reveal as="section" className="admin-panel">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18 }}>
          Explore Mr Truth
          <Link href="/services" className="admin-link" style={{ fontSize: 11.5 }}>ALL SERVICES <ArrowRight size={12} style={{ verticalAlign: -2 }} /></Link>
        </h2>
        <div className="mqa-grid">
          <Link className="mqa" href="/work-and-pay">
            <CarFront size={20} />
            <span>Work &amp; Pay Ghana<small>Vehicle ownership pathway</small></span>
          </Link>
          <Link className="mqa" href="/vehicles">
            <CarFront size={20} />
            <span>Vehicles<small>Browse the latest listings</small></span>
          </Link>
          <Link className="mqa" href="/rentals">
            <IdCard size={20} />
            <span>Car Rentals<small>Request dates &amp; rates</small></span>
          </Link>
          <Link className="mqa" href="/jobs">
            <Briefcase size={20} />
            <span>Job Board<small>Open roles we are recruiting for</small></span>
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
