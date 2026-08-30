'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3, CarFront, ChartPie, CreditCard, FileText, Home, Image as ImageIcon, Inbox, KeyRound, LayoutDashboard,
  LogOut, Mail, Menu, Newspaper, Package, Settings, Share2, Users, X
} from 'lucide-react';

const groups: { label: string; items: [string, string, typeof LayoutDashboard][] }[] = [
  {
    label: 'Overview',
    items: [['Dashboard', '/admin', LayoutDashboard]]
  },
  {
    label: 'Content',
    items: [
      ['News', '/admin/news', Newspaper],
      ['Gallery', '/admin/gallery', ImageIcon],
      ['Resources', '/admin/resources', FileText],
      ['Statistics', '/admin/statistics', BarChart3]
    ]
  },
  {
    label: 'Community',
    items: [
      ['Applications', '/admin/applications', Inbox],
      ['Members', '/admin/members', Users],
      ['Messages', '/admin/messages', Mail],
      ['Subscribers', '/admin/subscribers', Mail]
    ]
  },
  {
    label: 'Finance',
    items: [
      ['Financial Analytics', '/admin/finance', ChartPie],
      ['Payments', '/admin/payments', CreditCard],
      ['Fee Settings', '/admin/settings/fees', BarChart3],
      ['Paystack Keys', '/admin/settings/paystack', KeyRound]
    ]
  },
  {
    label: 'Agency Operations',
    items: [
      ['Services', '/admin/services', LayoutDashboard],
      ['Vehicles', '/admin/vehicles', CarFront],
      ['Rental enquiries', '/admin/rentals', Inbox],
      ['Automotive goods', '/admin/products', Package],
      ['Recruitment', '/admin/recruitment', Users]
    ]
  },
  {
    label: 'Site',
    items: [
      ['Settings', '/admin/settings', Settings],
      ['Social Links', '/admin/settings/social', Share2]
    ]
  }
];

export default function AdminSidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Escape-to-close + body scroll lock while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const brand = (
    <Link href="/admin" className="admin-brand">
      <img src="/logo-mark.png" alt="Mr Truth Agency logo placeholder" className="brand-logo" width={42} height={42} />
      <div>
        <div className="brand-name">MR TRUTH</div>
        <small className="brand-sub" style={{ color: '#FFD2B3' }}>AGENCY CONTROL</small>
      </div>
    </Link>
  );

  const navGroups = groups.map((group) => (
    <div className="admin-nav-group" key={group.label}>
      <p className="admin-nav-label">{group.label}</p>
      <nav className="admin-nav" aria-label={`${group.label} administration`}>
        {group.items.map(([label, href, Icon]) => (
          <Link key={href} href={href} className={pathname === href ? 'active' : ''} onClick={() => setOpen(false)}>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
    </div>
  ));

  const foot = (
    <div className="admin-sidebar-foot">
      <div className="admin-user">
        <span className="admin-avatar">{initials || 'MT'}</span>
        <span className="admin-user-meta">
          <strong>{name}</strong>
          <small>{role.replace('_', ' ')}</small>
        </span>
      </div>
      <form action="/api/admin/logout" method="post">
        <button type="submit" className="admin-logout"><LogOut size={13} style={{ verticalAlign: -2, marginRight: 6 }} />SIGN OUT</button>
      </form>
      <Link href="/" className="admin-public-link"><Home size={13} /> VIEW PUBLIC SITE</Link>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar">
        {brand}
        {navGroups}
        {foot}
      </aside>

      {/* Mobile top bar */}
      <header className="admin-topbar">
        <button type="button" className="admin-menu-btn" aria-label="Open administration menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu size={20} />
        </button>
        <Link href="/admin" className="admin-topbar-brand">
          <img src="/logo-mark.png" alt="" className="admin-topbar-mark" width={32} height={32} />
          <span className="admin-topbar-name">MR TRUTH<small>AGENCY CONTROL</small></span>
        </Link>
        <span className="admin-topbar-avatar" aria-hidden>{initials || 'MT'}</span>
      </header>

      {/* Mobile slide-in drawer */}
      <div className={`admin-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <button type="button" className="admin-drawer-backdrop" tabIndex={open ? 0 : -1} aria-label="Close menu" onClick={() => setOpen(false)} />
        <div className="admin-drawer-panel" role="dialog" aria-modal="true" aria-label="Administration navigation">
          <div className="admin-drawer-head">
            {brand}
            <button type="button" className="admin-drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="admin-drawer-nav">{navGroups}</div>
          {foot}
        </div>
      </div>
    </>
  );
}
