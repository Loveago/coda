import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  Download,
  IdCard,
  MapPin,
  PartyPopper,
  ReceiptText,
  Sparkles,
  UserRound,
  Wallet
} from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { computeMembershipStatus } from '@/lib/membership';
import { formatGhs, getFees } from '@/lib/fees';
import { applySuccessfulPayment, paystackConfigured, verifyWithPaystack } from '@/lib/payments/payment-service';
import PayDuesButton from '@/components/PayDuesButton';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

const paymentNotices: Record<string, { title: string; text: string; tone: 'good' | 'warn' | 'bad' }> = {
  success: { title: 'Payment received 🎉', text: 'Your registration fee is confirmed and your application has been submitted to the membership committee for review.', tone: 'good' },
  failed: { title: 'Payment did not complete', text: 'The payment was cancelled or failed. No charge was made — try again below to submit your application.', tone: 'bad' },
  pending: { title: 'Payment is processing', text: 'Your payment is still being confirmed by the payment provider. This page updates automatically once it clears — no need to pay again.', tone: 'warn' },
  mismatch: { title: 'Payment could not be matched', text: 'The payment amount did not match your registration fee. Please contact support with your payment reference before trying again.', tone: 'bad' },
  missing: { title: 'We could not find your payment', text: 'If you completed a payment, it may still be processing — check your payment history. Otherwise, try again below.', tone: 'warn' }
};

export default async function MemberDashboard({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const [portal, { payment: paymentParam }] = await Promise.all([getPortalMember(), searchParams]);
  if (!portal) redirect('/login');

  // PENDING applicants see the application gate: pay the registration fee
  // (when enabled) to submit the application for admin review.
  if (portal.status === 'PENDING') {
    const fees = await getFees();

    // Reconciliation fallback: when the applicant returns from checkout (or
    // reloads this page) any still-PENDING paystack payment is re-verified
    // server-side. This covers lost webhooks, closed tabs and slow providers —
    // the browser never decides the outcome.
    let registrationPayment = portal.registrationPayment;
    if (registrationPayment === 'PENDING' && (await paystackConfigured())) {
      const pending = await db.payment.findFirst({
        where: { memberId: portal.id, type: 'REGISTRATION_FEE', status: 'PENDING', provider: 'paystack' },
        orderBy: { createdAt: 'desc' }
      });
      if (pending) {
        try {
          const verified = await verifyWithPaystack(pending.reference);
          if (verified.status === 'success' && verified.amount === pending.amount && verified.currency === pending.currency) {
            await applySuccessfulPayment(pending.reference, String(verified.id));
            registrationPayment = 'PAID';
          } else if (verified.status === 'failed' || verified.status === 'abandoned' || verified.status === 'invalid') {
            await db.payment.update({ where: { reference: pending.reference }, data: { status: 'FAILED' } });
          }
        } catch {
          // Provider unreachable — leave the payment PENDING and let the
          // webhook / next visit reconcile it.
        }
      }
    }
    const unpaid = registrationPayment === 'PENDING';
    const notice = paymentNotices[paymentParam ?? ''] ?? null;
    return (
      <main className="mdash">
        <section className="mwelcome">
          <div>
            <h1>Welcome, {portal.firstName} 👋</h1>
            <p>Member ID: <span className="mwelcome-id">{portal.memberNumber}</span></p>
          </div>
          <span className={`mdash-pill tone-${unpaid ? 'warn' : 'good'}`} style={{ alignSelf: 'center' }}>{unpaid ? 'ACTION NEEDED' : 'SUBMITTED'}</span>
        </section>
        {notice && (
          <Reveal as="section" className={`renew-banner${notice.tone === 'bad' ? ' bad' : notice.tone === 'good' ? ' good' : ''}`}>
            <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
              <h2>{notice.title}</h2>
              <p>{notice.text}</p>
            </div>
          </Reveal>
        )}
        <Reveal as="section" className="renew-banner">
          <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
            <h2>{unpaid ? 'One step left — pay your registration fee' : 'Your application is with our team'}</h2>
            <p>
              {unpaid
                ? `A one-time registration fee of ${formatGhs(fees.registrationFeeAmount)} is required before your application is submitted to the membership committee. Pay once and you're done.`
                : 'Your application has been submitted and is being reviewed by the membership committee. You will be notified once a decision is made — approved members get instant access to the full portal and digital ID card.'}
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10, justifyItems: 'start' }}>
            {unpaid && <PayDuesButton type="REGISTRATION_FEE" label={`PAY ${formatGhs(fees.registrationFeeAmount)}`} />}
            <Link href="/membership-status" className="admin-link">CHECK STATUS ANYTIME →</Link>
          </div>
        </Reveal>
      </main>
    );
  }
  if (portal.status === 'REJECTED') redirect('/member/profile');

  const [member, fees, totals] = await Promise.all([
    db.member.findUnique({
      where: { id: portal.id },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } }
    }),
    getFees(),
    db.payment.aggregate({ where: { memberId: portal.id, status: 'SUCCESSFUL' }, _sum: { amount: true }, _count: true })
  ]);
  if (!member) redirect('/login');

  const computed = computeMembershipStatus(member);
  const duesUnpaid = computed === 'DUE' && !member.membershipEndDate;
  const needsRenewal = computed === 'DUE' || computed === 'OVERDUE';
  const duesPaid = member.payments.some((p) => p.type === 'ANNUAL_DUES' && p.status === 'SUCCESSFUL');
  const regPaid = member.registrationPayment === 'PAID' || member.registrationPayment === 'NOT_REQUIRED';

  const timeline = [
    { label: 'Registered', date: dateFormatter.format(member.createdAt), state: 'done' as const },
    { label: 'Approved', date: member.status === 'APPROVED' ? dateFormatter.format(member.updatedAt) : '—', state: member.status === 'APPROVED' ? ('done' as const) : ('current' as const) },
    { label: 'Registration Paid', date: regPaid ? 'Paid' : 'Pending', state: regPaid ? ('done' as const) : ('current' as const) },
    { label: 'Annual Dues Paid', date: duesPaid ? 'Paid' : duesUnpaid ? 'Unpaid' : '—', state: duesPaid ? ('done' as const) : ('current' as const) },
    { label: 'Valid Until', date: member.membershipEndDate ? dateFormatter.format(member.membershipEndDate) : '—', state: computed === 'ACTIVE' ? ('done' as const) : ('current' as const) }
  ];

  const statusTone = computed === 'ACTIVE' ? 'green' : computed === 'OVERDUE' ? 'red' : 'amber';
  const statusLabel = duesUnpaid ? 'DUES UNPAID' : computed;

  return (
    <main className="mdash">
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
                <small>FAN CLUB</small>
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
              <div className="idcard-thru"><small>VALID THRU</small><strong>{member.membershipEndDate ? dateFormatter.format(member.membershipEndDate) : '—'}</strong></div>
              <span className={`idcard-status-pill ${computed === 'ACTIVE' ? 'good' : computed === 'OVERDUE' ? 'bad' : 'warn'}`}>{computed}</span>
            </div>
          </div>
        </Link>
      </section>

      {/* ===== Renewal banner ===== */}
      {needsRenewal && (
        <Reveal as="section" className={`renew-banner${computed === 'OVERDUE' ? ' bad' : ''}`}>
          <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
            <h2>{duesUnpaid ? 'Welcome aboard — pay your annual dues' : computed === 'OVERDUE' ? 'Your membership has expired' : 'Time to renew your dues'}</h2>
            <p>
              {duesUnpaid
                ? `Your application has been approved! Annual membership dues of ${formatGhs(fees.annualDuesAmount)} are currently unpaid. Pay once to activate your membership and digital ID card for a full year.`
                : computed === 'OVERDUE'
                  ? `Renew for ${formatGhs(fees.annualDuesAmount)} today to instantly restore your benefits and ID card validity.`
                  : `Annual dues of ${formatGhs(fees.annualDuesAmount)} keep your benefits and ID card active for another full year.`}
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <PayDuesButton type="ANNUAL_DUES" label={duesUnpaid ? `PAY ${formatGhs(fees.annualDuesAmount)} DUES` : computed === 'OVERDUE' ? 'RENEW NOW' : 'PAY ANNUAL DUES'} />
          </div>
        </Reveal>
      )}

      {/* ===== Stat tiles ===== */}
      <section className="mstat-tiles">
        <Reveal className="mstat">
          <span className="mstat-icon tone-blue"><BadgeCheck size={21} /></span>
          <div>
            <small>Membership Status</small>
            <strong className={`tone-${statusTone}`}>{statusLabel}</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{member.membershipEndDate ? `Valid until ${dateFormatter.format(member.membershipEndDate)}` : 'Activate with annual dues'}</span>
          </div>
        </Reveal>
        <Reveal className="mstat" delay={60}>
          <span className="mstat-icon tone-blue"><Wallet size={21} /></span>
          <div>
            <small>Annual Dues</small>
            <strong>{formatGhs(fees.annualDuesAmount)}</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{member.membershipEndDate ? `Next due: ${dateFormatter.format(member.membershipEndDate)}` : 'Due on activation'}</span>
          </div>
        </Reveal>
        <Reveal className="mstat" delay={120}>
          <span className="mstat-icon tone-blue"><ReceiptText size={21} /></span>
          <div>
            <small>Registration Fee</small>
            <strong className={regPaid ? 'tone-green' : ''}>{regPaid ? 'PAID' : 'PENDING'}</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Amount: {formatGhs(fees.registrationFeeAmount)}</span>
          </div>
        </Reveal>
        <Reveal className="mstat" delay={180}>
          <span className="mstat-icon tone-blue"><Sparkles size={21} /></span>
          <div>
            <small>Total Paid</small>
            <strong>{formatGhs(totals._sum.amount ?? 0)}</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{totals._count > 0 ? `Thank you! ${totals._count} payment${totals._count === 1 ? '' : 's'}` : 'No payments yet'}</span>
          </div>
        </Reveal>
      </section>

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
            <PayDuesButton type="ANNUAL_DUES" label="Pay Annual Dues" asTile />
            <Link className="mqa" href="/member/id-card">
              <Download size={20} />
              <span>Download ID Card<small>View or download</small></span>
            </Link>
            <Link className="mqa" href="/member/payments">
              <ReceiptText size={20} />
              <span>View Receipts<small>Payment history</small></span>
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
            <CalendarDays size={18} />
            <div>
              <time>{member.membershipEndDate ? dateFormatter.format(member.membershipEndDate) : 'On activation'}</time>
              <strong>Membership Expires</strong>
              <small>{member.membershipEndDate ? `Annual dues will be due in ${Math.max(0, Math.ceil((member.membershipEndDate.getTime() - Date.now()) / 86_400_000))} days.` : 'Pay your annual dues to activate a full membership year.'}</small>
            </div>
          </div>
          <div className="mup-item">
            <PartyPopper size={18} />
            <div>
              <time>Monthly · First Saturday</time>
              <strong>Exclusive Member Event</strong>
              <small>Meet & greet with the Mr Truth community — Accra, Ghana.</small>
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
        </Reveal>
      </div>

      {/* ===== Recent payments ===== */}
      <Reveal as="section" className="admin-panel">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18 }}>
          Recent Payments
          <Link href="/member/payments" className="admin-link" style={{ fontSize: 11.5 }}>VIEW ALL →</Link>
        </h2>
        {member.payments.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No payments yet — your receipts will appear here.</p>
        ) : (
          <div className="pay-timeline">
            {member.payments.map((payment) => (
              <Link className={`pay-item pay-${payment.status.toLowerCase()}`} key={payment.id} href={`/member/payments/${payment.id}`}>
                <span className="pay-item-main">
                  <strong>{payment.type === 'ANNUAL_DUES' ? 'Annual membership dues' : 'Registration fee'}</strong>
                  <small>Ref {payment.reference.slice(0, 16)}…</small>
                </span>
                <span className="pay-item-side">
                  <strong>{formatGhs(payment.amount)}</strong>
                  <small>{dateFormatter.format(payment.paidAt ?? payment.createdAt)}</small>
                </span>
                <ArrowUpRight size={15} className="pay-item-arrow" />
              </Link>
            ))}
          </div>
        )}
      </Reveal>

      {/* ===== Explore ===== */}
      <Reveal as="section" className="admin-panel">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18 }}>
          Explore Mr Truth
          <Link href="/services" className="admin-link" style={{ fontSize: 11.5 }}>ALL SERVICES <ArrowRight size={12} style={{ verticalAlign: -2 }} /></Link>
        </h2>
        <div className="mqa-grid">
          <Link className="mqa" href="/vehicles">
            <CarFront size={20} />
            <span>Vehicles<small>Browse the latest listings</small></span>
          </Link>
          <Link className="mqa" href="/rentals">
            <IdCard size={20} />
            <span>Rentals<small>Request dates & rates</small></span>
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
