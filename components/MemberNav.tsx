'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarDays, CreditCard, Gift, Headphones, IdCard, LayoutDashboard, LogOut, Search, Settings, Sparkles, UserRound } from 'lucide-react';

type NavMember = {
  firstName: string;
  lastName: string;
  memberNumber: string;
  photoUrl: string | null;
};

const links = [
  { href: '/member/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/member/profile', label: 'My Profile', Icon: UserRound },
  { href: '/membership', label: 'Membership', Icon: Sparkles },
  { href: '/member/payments', label: 'Payments', Icon: CreditCard },
  { href: '/member/id-card', label: 'My Benefits', Icon: IdCard },
  { href: '/news', label: 'Events', Icon: CalendarDays },
  { href: '/automotive', label: 'Offers', Icon: Gift },
  { href: '/member/profile', label: 'Settings', Icon: Settings },
  { href: '/contact', label: 'Support', Icon: Headphones }
] as const;

const tabLinks = [
  { href: '/member/dashboard', label: 'Home', Icon: LayoutDashboard },
  { href: '/membership', label: 'Membership', Icon: Sparkles },
  { href: '/member/payments', label: 'Payments', Icon: CreditCard },
  { href: '/member/id-card', label: 'ID Card', Icon: IdCard },
  { href: '/member/profile', label: 'More', Icon: UserRound }
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
          <img src="/logo-mark.png" alt="Mr Truth Fan Club logo" className="brand-logo" width={42} height={42} />
          <div>
            <div className="brand-name">MR TRUTH</div>
            <small className="brand-sub" style={{ color: '#FFD2B3' }}>FAN CLUB</small>
          </div>
        </Link>
        <div className="admin-nav-group">
          <nav className="admin-nav" aria-label="Member navigation">
            {links.map(({ href, label, Icon }) => (
              <Link key={label} href={href} className={isActive(href) && label !== 'Settings' ? 'active' : ''}>
                <Icon size={16} /> {label}
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

      {/* ===== Desktop top bar ===== */}
      <header className="mdashbar">
        <form className="msearch" action="/news" method="get" role="search">
          <Search size={15} />
          <input type="search" name="q" placeholder="Search anything..." aria-label="Search news and updates" />
        </form>
        <div className="mdashbar-actions">
          <Link href="/news" className="mdashbar-bell" aria-label="Notifications">
            <Bell size={17} />
            <i>3</i>
          </Link>
          <Link href="/member/profile" className="mdashbar-user">
            {member.photoUrl ? <img src={member.photoUrl} alt="" /> : <span className="mdashbar-avatar">{initials}</span>}
            <div>
              <strong>{member.firstName} {member.lastName}</strong>
              <small>Member</small>
            </div>
          </Link>
        </div>
      </header>

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
        {tabLinks.map(({ href, label, Icon }) => (
          <Link key={label} href={href} className={`mtab${isActive(href) ? ' active' : ''}`}>
            <span className="mtab-ico"><Icon size={19} /></span>
            <span className="mtab-label">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
