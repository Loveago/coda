import { redirect } from 'next/navigation';
import { getPortalMember } from '@/lib/members-auth';
import MemberNav from '@/components/MemberNav';
import '../globals.css';

export const dynamic = 'force-dynamic';

export default async function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const member = await getPortalMember();
  if (!member) redirect('/login');
  if (member.status === 'SUSPENDED') {
    return (
      <main className="login-wrap">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <h1>Account suspended</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Your membership is currently suspended. Please contact the association for assistance.</p>
          <form action="/api/members/logout" method="post"><button className="btn btn-ghost">SIGN OUT</button></form>
        </div>
      </main>
    );
  }

  return (
    <div className="mshell">
      <MemberNav
        member={{
          firstName: member.firstName,
          lastName: member.lastName,
          memberNumber: member.memberNumber,
          photoUrl: member.photoUrl ?? null
        }}
      />
      <main className="mcontent">{children}</main>
    </div>
  );
}
