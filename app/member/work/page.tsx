import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Briefcase, CircleDollarSign } from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { getFees, formatGhs } from '@/lib/fees';
import { CORE_TRACK_SLUGS } from '@/lib/work-applications';
import WorkApplicationPortal from '@/components/WorkApplicationPortal';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Work Applications | Mr Truth Member Portal', description: 'Submit and track your job applications with Mr Truth Agency.' };

const paymentNotices: Record<string, { title: string; text: string; tone: 'good' | 'warn' | 'bad' }> = {
  success: { title: 'Application fee received 🎉', text: 'Your payment is confirmed and your application has been submitted to our recruiters. Track its progress above.', tone: 'good' },
  failed: { title: 'Payment did not complete', text: 'The payment was cancelled or failed — no charge was made. Pay again from your application card to submit it.', tone: 'bad' },
  pending: { title: 'Payment is processing', text: 'Your payment is still being confirmed by the payment provider. This page updates automatically once it clears — no need to pay again.', tone: 'warn' },
  mismatch: { title: 'Payment could not be matched', text: 'The payment amount did not match the application fee. Please contact support with your payment reference.', tone: 'bad' },
  missing: { title: 'We could not find your payment', text: 'If you completed a payment, it may still be processing — check your payment history. Otherwise, try again from your application card.', tone: 'warn' }
};

export default async function MemberWorkPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const [portal, { payment: paymentParam }] = await Promise.all([getPortalMember(), searchParams]);
  if (!portal) redirect('/login');
  // Work applications are a member-only benefit of the dashboard.
  if (portal.status !== 'APPROVED') redirect('/member/dashboard');
  const notice = paymentNotices[paymentParam ?? ''] ?? null;

  const [applications, fees, opportunities] = await Promise.all([
    db.workApplication.findMany({
      where: { memberId: portal.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, position: true, employmentType: true, region: true, status: true,
        paymentState: true, createdAt: true, cvUrl: true
      }
    }),
    getFees(),
    // Only the two active tracks are offered: Work and Pay, and Daily Sales.
    db.driverOpportunity.findMany({ where: { status: 'OPEN', slug: { in: [...CORE_TRACK_SLUGS] } }, select: { id: true, title: true, description: true }, orderBy: { createdAt: 'asc' }, take: 8 })
  ]);

  const serialized = applications.map((application) => ({
    ...application,
    createdAt: application.createdAt.toISOString()
  }));

  return (
    <main className="mdash">
      <section className="mwelcome">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Briefcase size={30} /> Work & Pay</h1>
          <p>Apply for driving and fleet roles, track your applications, and manage your application fee — all from your member dashboard.</p>
        </div>
        <span className="mdash-pill tone-good" style={{ alignSelf: 'center' }}>MEMBERS ONLY</span>
      </section>

      {notice && (
        <Reveal as="section" className={`renew-banner${notice.tone === 'bad' ? ' bad' : notice.tone === 'good' ? ' good' : ''}`}>
          <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
            <h2>{notice.title}</h2>
            <p>{notice.text}</p>
          </div>
        </Reveal>
      )}
      {fees.workApplicationFeeEnabled ? (
        <Reveal as="section" className="renew-banner">
          <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
            <h2><CircleDollarSign size={17} style={{ verticalAlign: -3 }} /> Application fee: {formatGhs(fees.workApplicationFeeAmount)}</h2>
            <p>Each new application requires a one-time {formatGhs(fees.workApplicationFeeAmount)} processing fee. Your application is only sent to recruiters once the payment is confirmed — you will see its status update here automatically.</p>
          </div>
        </Reveal>
      ) : (
        <Reveal as="section" className="renew-banner good">
          <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
            <h2>Applications are free for members 🎉</h2>
            <p>Submit as many applications as you like — no processing fee is required. Recruiters see your application immediately.</p>
          </div>
        </Reveal>
      )}

      <WorkApplicationPortal
        initialApplications={serialized}
        opportunities={opportunities}
        feeEnabled={fees.workApplicationFeeEnabled}
        feeAmount={fees.workApplicationFeeAmount}
        memberPhone={portal.phone}
      />

      <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        Looking for something else? <Link href="/services/driver-recruitment" className="admin-link">Browse driver opportunities →</Link>
      </p>
    </main>
  );
}
