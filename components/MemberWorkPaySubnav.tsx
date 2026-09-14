'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CarFront, CreditCard, FileCheck2, Headphones, LayoutDashboard, Wrench } from 'lucide-react';

const tabs = [
  { href: '/member/work-and-pay', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/member/work-and-pay/contract', label: 'Legal Contract', icon: FileCheck2 },
  { href: '/member/work-and-pay/payments', label: 'Payments & Installments', icon: CreditCard },
  { href: '/member/work-and-pay/vehicle', label: 'Assigned Vehicle', icon: CarFront },
  { href: '/member/work-and-pay/support', label: 'Support & Tickets', icon: Headphones }
];

export default function MemberWorkPaySubnav() {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--line)', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: isActive ? 'var(--blue)' : 'transparent',
              color: isActive ? '#fff' : 'var(--muted)',
              transition: 'all .15s ease'
            }}
          >
            <Icon size={16} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
