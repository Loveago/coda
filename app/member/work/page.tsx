import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { CORE_TRACK_SLUGS } from '@/lib/work-applications';
import WorkApplicationPortal from '@/components/WorkApplicationPortal';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Work & Jobs | Mr Truth Member Portal', description: 'Submit and track your job applications with Mr Truth Agency — driving, logistics, sales, admin and more.' };

export default async function MemberWorkPage() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');
  // Work applications are a member-only benefit of the dashboard.
  if (portal.status !== 'APPROVED') redirect('/member/dashboard');

  const [applications, opportunities] = await Promise.all([
    db.workApplication.findMany({
      where: { memberId: portal.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, position: true, employmentType: true, region: true, status: true,
        paymentState: true, createdAt: true, cvUrl: true
      }
    }),
    // The agency's own core tracks plus any general roles added by admins.
    db.driverOpportunity.findMany({ where: { status: 'OPEN' }, select: { id: true, title: true, description: true }, orderBy: { createdAt: 'asc' }, take: 12 })
  ]);

  const serialized = applications.map((application) => ({
    ...application,
    createdAt: application.createdAt.toISOString()
  }));

  return (
    <main className="mdash">
      <section className="mwelcome">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Briefcase size={30} /> Work & Jobs</h1>
          <p>Apply for driving, sales, admin, skilled and other roles — track every application and its status in one place.</p>
        </div>
        <span className="mdash-pill tone-good" style={{ alignSelf: 'center' }}>MEMBERS ONLY</span>
      </section>

      <Reveal as="section" className="renew-banner good">
        <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
          <h2>Applications are free for members 🎉</h2>
          <p>Submit as many applications as you like — no processing fee is required. Recruiters see your application immediately.</p>
        </div>
      </Reveal>

      <WorkApplicationPortal
        initialApplications={serialized}
        opportunities={opportunities}
        memberPhone={portal.phone}
      />

      <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        Looking for something else? <Link href="/jobs" className="admin-link">Browse the general recruitment board →</Link>
      </p>
    </main>
  );
}
