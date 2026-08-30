'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, IdCard, LayoutDashboard, LogOut, UserRound } from 'lucide-react';

type NavMember = {
  firstName: string;
  lastName: string;
  memberNumber: string;
  photoUrl: string | null;
};

const links = [
  { href: '/member/dashboard', label: 'Home', Icon: LayoutDashboard },
  { href: '/member/payments', label: 'Payments', Icon: CreditCard },
  { href: '/member/id-card', label: 'ID Card', Icon: IdCard },
  { href: '/member/profile', label: 'Profile', Icon: UserRound }
] as const;

export default function MemberNav({ member }: { member: NavMember }) {
  const pathname = usePathname();
  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();
  const avatar = member.photoUrl ? (
    <img src={member.photoUrl} alt="" />
  ) : (
    <span className="mtop-avatar-fallback">{initials}</span>
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* ===== Desktop sidebar ===== */}
      <aside className="msidebar">
        <Link href="/" className="admin-brand">
          <img src="/logo-mark.png" alt="Mr Truth Agency logo placeholder" className="brand-logo" width={42} height={42} />
          <div>
            <div className="brand-name">MR TRUTH</div>
            <small className="brand-sub" style={{ color: '#8fb0e0' }}>MEMBER PORTAL</small>
          </div>
        </Link>
        <div className="admin-nav-group">
          <p className="admin-nav-label">My Membership</p>
          <nav className="admin-nav" aria-label="Member navigation">
            {links.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>
                <Icon size={16} /> {label === 'Home' ? 'Dashboard' : label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="msidebar-card">
          <div className="msidebar-card-top">
            {member.photoUrl
              ? <img src={member.photoUrl} alt="" />
              : <span>{initials}</span>}
            <div>
              <strong>{member.firstName} {member.lastName}</strong>
              <small>{member.memberNumber}</small>
            </div>
          </div>
          <form action="/api/members/logout" method="post">
            <button type="submit" className="msidebar-logout"><LogOut size={13} /> SIGN OUT</button>
          </form>
        </div>
        <Link href="/" className="msidebar-public">← PUBLIC SITE</Link>
      </aside>

      {/* ===== Mobile top bar ===== */}
      <header className="mtopbar">
        <Link href="/member/dashboard" className="mtop-brand" aria-label="Mr Truth member home">
          <img src="/logo-mark.png" alt="" className="mtop-mark" width={32} height={32} />
          <span className="mtop-name">MR TRUTH<small>FAN CLUB</small></span>
        </Link>
        <div className="mtop-actions">
          <Link href="/member/profile" className="mtop-avatar" aria-label="My profile">{avatar}</Link>
          <form action="/api/members/logout" method="post">
            <button type="submit" className="mtop-exit" aria-label="Sign out"><LogOut size={16} /></button>
          </form>
        </div>
      </header>

      {/* ===== Mobile bottom tabs ===== */}
      <nav className="mtabs" aria-label="Member navigation">
        {links.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`mtab${isActive(href) ? ' active' : ''}`}>
            <span className="mtab-ico"><Icon size={19} /></span>
            <span className="mtab-label">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
