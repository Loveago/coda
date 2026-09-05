import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CarFront,
  Check,
  Download,
  Home,
  IdCard,
  MapPin,
  PartyPopper,
  Sparkles,
  UserRound
} from 'lucide-react';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export default async function MemberDashboard() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  // PENDING applicants see the application status card — membership is free,
  // so there is nothing to pay, the committee just needs to review.
  if (portal.status === 'PENDING') {
    return (
      <main className="mdash">
        <section className="mwelcome">
          <div>
            <h1>Welcome, {portal.firstName} 👋</h1>
            <p>Member ID: <span className="mwelcome-id">{portal.memberNumber}</span></p>
          </div>
          <span className="mdash-pill tone-good" style={{ alignSelf: 'center' }}>SUBMITTED</span>
        </section>
        <Reveal as="section" className="renew-banner good">
          <div style={{ flex: 1, minWidth: 230, position: 'relative', zIndex: 1 }}>
            <h2>Your application is with our team</h2>
            <p>
              Membership with Mr Truth Agency is completely free — there is no registration fee and no annual dues.
              Your application has been submitted and is being reviewed by the membership committee. You will be
              notified once a decision is made — approved members get instant access to the full portal and digital ID card.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10, justifyItems: 'start' }}>
            <Link href="/membership-status" className="admin-link">CHECK STATUS ANYTIME →</Link>
          </div>
        </Reveal>
      </main>
    );
  }
  if (portal.status === 'REJECTED') redirect('/member/profile');

  const [member, openRoles] = await Promise.all([
    db.member.findUnique({ where: { id: portal.id } }),
    db.driverOpportunity.count({ where: { status: 'OPEN' } })
  ]);
  if (!member) redirect('/login');

  const timeline = [
    { label: 'Registered', date: dateFormatter.format(member.createdAt), state: 'done' as const },
    { label: 'Approved', date: member.status === 'APPROVED' ? dateFormatter.format(member.updatedAt) : '—', state: member.status === 'APPROVED' ? ('done' as const) : ('current' as const) },
    { label: 'Membership', date: 'Free · Lifetime', state: 'done' as const },
    { label: 'Digital ID Card', date: member.status === 'APPROVED' ? 'Ready' : 'On approval', state: member.status === 'APPROVED' ? ('done' as const) : ('current' as const) }
  ];

  return (
    <main className="mdash">
      {/* ===== Welcome + ID card ===== */}
      <section className="mwelcome">
        <div>
          <h1>Welcome back,<br />{member.firstName} {member.lastName} 👋</h1>
          <p>Member ID: <span className="mwelcome-id">{member.memberNumber}</span></p>
        </div>
        <Link href="/member/id-card" className="mwelcome-card" aria-label="Open your digital ID card">
          <div className="idcard-face idcard-front" aria-hidden>
            <span className="idcard-band" />
            <div className="idcard-head">
              <img src="/logo-mark.png" alt="" className="idcard-logo" width={30} height={30} />
              <div>
                <strong>MR TRUTH</strong>
                <small>AGENCY MEMBER</small>
              </div>
              <span className="idcard-valid-tag">MEMBER</span>
            </div>
            <div className="idcard-mid">
              <div>
                <p className="idcard-number" style={{ margin: 0 }}>{member.memberNumber}</p>
                <span className="idcard-platform"><Sparkles size={9} /> {member.location || 'ACCRA · GHANA'}</span>
              </div>
            </div>
            <div className="idcard-bottom">
              <div className="idcard-thru"><small>MEMBERSHIP</small><strong>FREE · LIFETIME</strong></div>
              <span className="idcard-status-pill good">ACTIVE</span>
            </div>
          </div>
        </Link>
      </section>

      {/* ===== Stat tiles ===== */}
      <section className="mstat-tiles">
        <Reveal className="mstat">
          <span className="mstat-icon tone-blue"><BadgeCheck size={21} /></span>
          <div>
            <small>Membership Status</small>
            <strong className="tone-green">ACTIVE</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Free for life — no fees, ever</span>
          </div>
        </Reveal>
        <Reveal className="mstat" delay={60}>
          <span className="mstat-icon tone-blue"><Briefcase size={21} /></span>
          <div>
            <small>Open Job Roles</small>
            <strong>{openRoles}</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Apply free from your portal</span>
          </div>
        </Reveal>
        <Reveal className="mstat" delay={120}>
          <span className="mstat-icon tone-blue"><Home size={21} /></span>
          <div>
            <small>Property Services</small>
            <strong>MEMBER</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>Management, rentals & Airbnb hosting</span>
          </div>
        </Reveal>
        <Reveal className="mstat" delay={180}>
          <span className="mstat-icon tone-blue"><Sparkles size={21} /></span>
          <div>
            <small>Total Fees Paid</small>
            <strong className="tone-green">GHS 0.00</strong>
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>That is how we like it 🎉</span>
          </div>
        </Reveal>
      </section>

      {/* ===== Membership overview timeline ===== */}
      <Reveal as="section" className="moverview">
        <h2>Membership Overview</h2>
        <div className="mtimeline">
          {timeline.map((step) => (
            <div key={step.label} className={`mtimeline-step ${step.state}`}>
              <span className="mtimeline-dot">{step.state === 'done' ? <Check size={15} /> : <CalendarDays size={14} />}</span>
              <strong>{step.label}</strong>
              <span>{step.date}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ===== Quick actions + upcoming ===== */}
      <div className="mduo">
        <Reveal className="admin-panel">
          <h2>Quick Actions</h2>
          <div className="mqa-grid">
            <Link className="mqa" href="/member/work">
              <Briefcase size={20} />
              <span>Apply for Work<small>Jobs across every industry</small></span>
            </Link>
            <Link className="mqa" href="/member/id-card">
              <Download size={20} />
              <span>Download ID Card<small>View or print your card</small></span>
            </Link>
            <Link className="mqa" href="/property-management">
              <Building2 size={20} />
              <span>Property Services<small>Management & Airbnb hosting</small></span>
            </Link>
            <Link className="mqa" href="/member/profile">
              <UserRound size={20} />
              <span>Update Profile<small>Edit your information</small></span>
            </Link>
          </div>
        </Reveal>
        <Reveal className="admin-panel" delay={80}>
          <h2>Upcoming <Link href="/news">View all</Link></h2>
          <div className="mup-item">
            <PartyPopper size={18} />
            <div>
              <time>Monthly · First Saturday</time>
              <strong>Exclusive Member Event</strong>
              <small>Meet & greet with the Mr Truth community — Accra, Ghana.</small>
            </div>
          </div>
          <div className="mup-item">
            <MapPin size={18} />
            <div>
              <time>Always open</time>
              <strong>Partner Discounts</strong>
              <small>Active members save at partner garages, wash bays and fuel stops.</small>
            </div>
          </div>
          <div className="mup-item">
            <CalendarDays size={18} />
            <div>
              <time>Rolling</time>
              <strong>New Jobs Every Week</strong>
              <small>General recruitment across industries — check the job board often.</small>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ===== Explore ===== */}
      <Reveal as="section" className="admin-panel">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18 }}>
          Explore Mr Truth
          <Link href="/services" className="admin-link" style={{ fontSize: 11.5 }}>ALL SERVICES <ArrowRight size={12} style={{ verticalAlign: -2 }} /></Link>
        </h2>
        <div className="mqa-grid">
          <Link className="mqa" href="/vehicles">
            <CarFront size={20} />
            <span>Vehicles<small>Browse the latest listings</small></span>
          </Link>
          <Link className="mqa" href="/rentals">
            <IdCard size={20} />
            <span>Car Rentals<small>Request dates & rates</small></span>
          </Link>
          <Link className="mqa" href="/property-rentals">
            <Home size={20} />
            <span>Property Rentals<small>Homes & offices to let</small></span>
          </Link>
          <Link className="mqa" href="/jobs">
            <Briefcase size={20} />
            <span>Job Board<small>Open roles we are recruiting for</small></span>
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
