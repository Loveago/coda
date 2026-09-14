'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Wrench
} from 'lucide-react';

const links = [
  { href: '/admin/work-and-pay', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/work-and-pay/applications', label: 'Applications', icon: Users },
  { href: '/admin/work-and-pay/agreements', label: 'Agreements', icon: FileText },
  { href: '/admin/work-and-pay/payments', label: 'Payment Ledger', icon: CreditCard },
  { href: '/admin/work-and-pay/arrears', label: 'Arrears Monitor', icon: AlertTriangle },
  { href: '/admin/work-and-pay/deposits', label: 'Security Deposits', icon: DollarSign },
  { href: '/admin/work-and-pay/maintenance', label: 'Maintenance & Fleet', icon: Wrench },
  { href: '/admin/work-and-pay/ownership-transfers', label: 'DVLA Transfers', icon: ShieldCheck },
  { href: '/admin/work-and-pay/settings', label: 'Settings', icon: Settings }
];

export default function AdminWorkPaySubnav() {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--line)', marginBottom: 24, overflowX: 'auto', paddingBottom: 6 }}>
      {links.map((l) => {
        const Icon = l.icon;
        const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: isActive ? 'var(--blue)' : '#f8fafc',
              color: isActive ? '#fff' : 'var(--muted)',
              border: `1px solid ${isActive ? 'var(--blue)' : 'var(--line)'}`,
              transition: 'all .15s ease'
            }}
          >
            <Icon size={14} />
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
