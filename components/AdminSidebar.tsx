'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, ChartPie, CreditCard, FileText, Home, Image as ImageIcon, Inbox, KeyRound, LayoutDashboard,
  LogOut, Mail, Newspaper, Settings, Users
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
      ['Members', '/admin/members', Users],
      ['Messages', '/admin/messages', Inbox],
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
    label: 'Site',
    items: [['Settings', '/admin/settings', Settings]]
  }
];

export default function AdminSidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand">
        <div className="brand-mark">◉</div>
        <div>
          <div className="brand-name">GACODA</div>
          <small className="brand-sub" style={{ color: '#8fb0e0' }}>ADMIN PANEL</small>
        </div>
      </Link>
      {groups.map((group) => (
        <div className="admin-nav-group" key={group.label}>
          <p className="admin-nav-label">{group.label}</p>
          <nav className="admin-nav" aria-label={`${group.label} administration`}>
            {group.items.map(([label, href, Icon]) => (
              <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
        </div>
      ))}
      <div className="admin-sidebar-foot">
        <div className="admin-user">
          <span className="admin-avatar">{initials || 'GA'}</span>
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
    </aside>
  );
}
