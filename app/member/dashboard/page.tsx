import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  IdCard,
  LifeBuoy,
  MapPin,
  ReceiptText,
  UserRound,
  Wallet
} from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { computeMembershipStatus } from '@/lib/membership';
import { formatGhs, getFees } from '@/lib/fees';
import { applySuccessfulPayment, paystackConfigured, verifyWithPaystack } from '@/lib/payments/payment-service';
import PayDuesButton from '@/components/PayDuesButton';
import ValidityRing from '@/components/ValidityRing';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

const statusCopy: Record<string, { label: string; tone: 'good' | 'warn' | 'bad' }> = {
  ACTIVE: { label: 'MEMBERSHIP ACTIVE', tone: 'good' },
  DUE: { label: 'RENEWAL DUE', tone: 'warn' },
  OVERDUE: { label: 'EXPIRED', tone: 'bad' },
  SUSPENDED: { label: 'SUSPENDED', tone: 'bad' }
};

// A newly approved member has no membership period yet — that means their
// annual dues are simply UNPAID (not "renewal due"). Approval alone never
// grants a paid year; only the ANNUAL_DUES payment does.
const duesUnpaidCopy = { label: 'DUES UNPAID', tone: 'warn' as const };

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

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
        <section className="mdash-hero">
          <div className="mdash-hero-left">
            <p className="mdash-kicker">APPLICATION · {portal.memberNumber}</p>
            <h1>Welcome, {portal.firstName}</h1>
            <div className="mdash-chips">
              <span><UserRound size={12} /> {unpaid ? 'Awaiting registration fee' : 'Application under review'}</span>
            </div>
          </div>
          <div className="mdash-hero-right">
            <span className={`mdash-pill tone-${unpaid ? 'warn' : 'good'}`}>{unpaid ? 'ACTION NEEDED' : 'SUBMITTED'}</span>
          </div>
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

  const [member, fees, totals, updates] = await Promise.all([
    db.member.findUnique({
      where: { id: portal.id },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } }
    }),
    getFees(),
    db.payment.aggregate({ where: { memberId: portal.id, status: 'SUCCESSFUL' }, _sum: { amount: true }, _count: true }),
    db.newsArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: { slug: true, title: true, publishedAt: true }
    })
  ]);
  if (!member) redirect('/login');

  const computed = computeMembershipStatus(member);
  const duesUnpaid = computed === 'DUE' && !member.membershipEndDate;
  const badge = duesUnpaid ? duesUnpaidCopy : (statusCopy[computed] ?? statusCopy.ACTIVE);

  // Validity ring math — share of the membership year still remaining.
  let ringPercent = 0;
  let ringCaption = '—';
  let ringSub = 'no active period';
  let ringTone: 'good' | 'warn' | 'bad' = badge.tone;
  if ((computed === 'ACTIVE' || computed === 'DUE') && member.membershipEndDate) {
    const end = member.membershipEndDate.getTime();
    const start = (member.membershipStartDate ?? member.createdAt).getTime();
    const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
    const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / DAY_MS));
    ringPercent = Math.round((daysLeft / totalDays) * 100);
    ringCaption = String(daysLeft);
    ringSub = daysLeft === 1 ? 'day remaining' : 'days remaining';
  } else if (computed === 'OVERDUE') {
    ringCaption = '0';
    ringSub = 'membership expired';
  } else if (duesUnpaid) {
    ringCaption = '0';
    ringSub = 'annual dues unpaid';
  }

  const needsRenewal = computed === 'DUE' || computed === 'OVERDUE';
  const regLabel =
    member.registrationPayment === 'PAID'
      ? 'Paid'
      : member.registrationPayment === 'NOT_REQUIRED'
        ? 'Not required'
        : 'Pending';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();

  const profileFields: Array<[string, boolean]> = [
    ['Profile photo', Boolean(member.photoUrl)],
    ['Date of birth', Boolean(member.dateOfBirth)],
    ['Gender', Boolean(member.gender)],
    ['Location', Boolean(member.location)],
    ['Ride platform', Boolean(member.platform)],
    ['Experience', member.yearsExperience != null],
    ['Vehicle info', Boolean(member.vehicleInfo)],
    ['Number plate', Boolean(member.vehicleRegistration)],
    ['Emergency contact', Boolean(member.emergencyName && member.emergencyPhone)]
  ];
  const filledCount = profileFields.filter(([, complete]) => complete).length;
  const completeness = Math.round((filledCount / profileFields.length) * 100);
  const missingFields = profileFields.filter(([, complete]) => !complete).map(([label]) => label);

  return (
    <main className="mdash">
      {/* ===== HERO ===== */}
      <section className="mdash-hero">
        <span className="mdash-orb o1" aria-hidden />
        <span className="mdash-orb o2" aria-hidden />
        <div className="mdash-hero-left">
          <div className="mdash-avatar">
            {member.photoUrl ? <img src={member.photoUrl} alt="" /> : initials}
            {member.emailVerified && (
              <span className="mdash-check" title="Email verified"><BadgeCheck size={13} /></span>
            )}
          </div>
          <div>
            <p className="mdash-kicker">MEMBER PORTAL · {member.memberNumber}</p>
            <h1>{greeting}, {member.firstName}</h1>
            <div className="mdash-chips">
              <span><CalendarDays size={12} /> Member since {monthYear.format(member.createdAt)}</span>
              {member.location && <span><MapPin size={12} /> {member.location}</span>}
              {member.platform && <span><CarFront size={12} /> {member.platform}</span>}
            </div>
          </div>
        </div>
        <div className="mdash-hero-right">
          <ValidityRing percent={ringPercent} caption={ringCaption} sub={ringSub} tone={ringTone} />
          <span className={`mdash-pill tone-${badge.tone}`}>{badge.label}</span>
        </div>
      </section>

      {/* ===== DUES / RENEWAL BANNER ===== */}
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

      {/* ===== STAT TILES ===== */}
      <section className="mdash-tiles">
        {([
          { Icon: Wallet, value: formatGhs(fees.annualDuesAmount), label: 'Annual dues rate' },
          {
            Icon: ReceiptText,
            value: formatGhs(totals._sum.amount ?? 0),
            label: `Contributed · ${totals._count} payment${totals._count === 1 ? '' : 's'}`
          },
          { Icon: CalendarDays, value: member.membershipEndDate ? dateFormatter.format(member.membershipEndDate) : 'Unpaid', label: 'Valid until' },
          { Icon: BadgeCheck, value: regLabel, label: 'Registration fee' }
        ] as const).map(({ Icon, value, label }, index) => (
          <Reveal key={label} delay={index * 70} className="mdash-tile">
            <span className="mdash-tile-icon"><Icon size={21} /></span>
            <div><strong>{value}</strong><span>{label}</span></div>
          </Reveal>
        ))}
      </section>

      {/* ===== MAIN GRID ===== */}
      <div className="mdash-grid">
        <div className="mdash-col-main">
          <Reveal className="admin-panel">
            <h2>Payment history</h2>
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
            <Link href="/member/payments" className="admin-link" style={{ display: 'inline-block', marginTop: 14 }}>VIEW ALL PAYMENTS →</Link>
          </Reveal>

          {updates.length > 0 && (
            <Reveal className="admin-panel" delay={80}>
              <h2>Association updates</h2>
              <div className="mini-news">
                {updates.map((article) => (
                  <Link key={article.slug} href={`/news/${article.slug}`}>
                    <time>{article.publishedAt ? dateFormatter.format(article.publishedAt) : ''}</time>
                    <strong>{article.title}</strong>
                  </Link>
                ))}
              </div>
              <Link href="/news" className="admin-link" style={{ display: 'inline-block', marginTop: 12 }}>ALL NEWS →</Link>
            </Reveal>
          )}
        </div>

        <div className="mdash-col-side">
          <Reveal className="admin-panel" delay={40}>
            <Link href="/member/id-card" className="idcard-mini" aria-label="Open your digital ID card">
              <span className="idcard-mini-face" aria-hidden>
                <span className="idcard-mini-band" />
                <span className="idcard-mini-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><img src="/logo-mark.png" alt="" width={11} height={11} style={{ borderRadius: 3 }} /> GACODA</span>
                <strong>{member.memberNumber}</strong>
                <small>{member.firstName} {member.lastName}</small>
              </span>
              <span className="idcard-mini-copy">
                <IdCard size={19} />
                <strong>Digital ID card</strong>
                <small>Flip pass with scan-to-verify QR</small>
                <em>OPEN CARD →</em>
              </span>
            </Link>
          </Reveal>

          <Reveal className="admin-panel">
            <div className="pmeter-head">
              <h2>Profile strength</h2>
              <strong>{completeness}%</strong>
            </div>
            <div className="pmeter-bar"><span style={{ width: `${completeness}%` }} /></div>
            <p className="pmeter-note">{filledCount} of {profileFields.length} sections complete. A fuller profile helps the association serve you faster.</p>
            {missingFields.length > 0 ? (
              <div className="pmiss-wrap">
                {missingFields.map((label) => (
                  <Link className="pmiss" key={label} href="/member/profile">+ {label}</Link>
                ))}
              </div>
            ) : (
              <p className="pmeter-done"><BadgeCheck size={16} /> Your profile is complete — nice work!</p>
            )}
          </Reveal>

          <Reveal className="admin-panel" delay={80}>
            <h2>Quick actions</h2>
            <div className="qa-grid">
              {([
                { href: '/member/id-card', Icon: IdCard, title: 'My ID Card', desc: 'Digital pass & print' },
                { href: '/member/profile', Icon: UserRound, title: 'My Profile', desc: 'Update your details' },
                { href: '/member/payments', Icon: ReceiptText, title: 'Payments', desc: 'Receipts & history' },
                { href: '/contact', Icon: LifeBuoy, title: 'Get Help', desc: 'We reply fast' }
              ] as const).map(({ href, Icon, title, desc }) => (
                <Link className="qa-tile" key={href} href={href}>
                  <Icon size={20} />
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
