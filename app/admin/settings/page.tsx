import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, KeyRound, Share2, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings | Mr Truth Agency Admin'
};

const settingsLinks = [
  {
    href: '/admin/settings/membership',
    title: 'Membership Fees & Dues',
    description: 'Configure registration fees, annual dues, grace periods, and view versioned audit history.',
    icon: CreditCard,
    pill: 'NEW'
  },
  {
    href: '/admin/settings/codes',
    title: 'Registration Codes',
    description: 'Generate and track access codes required for new member registrations.',
    icon: KeyRound,
    pill: 'ACCESS'
  },
  {
    href: '/admin/settings/social',
    title: 'Social Links & Contact',
    description: 'Configure public social media profiles and contact channel links.',
    icon: Share2,
    pill: 'CHANNELS'
  }
];

export default function AdminSettingsHubPage() {
  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ color: 'var(--blue)' }}>PLATFORM CONFIGURATION</p>
          <h1>Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>
            Manage agency configuration, membership economics, invitation access, and external integrations.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: 16 }}>
        {settingsLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="panel"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform .15s ease, box-shadow .15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={22} />
                </span>
                <span className="pill tone-blue" style={{ fontSize: 10, padding: '2px 8px' }}>
                  {item.pill}
                </span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {item.description}
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginTop: 'auto' }}>
                Configure Settings →
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
