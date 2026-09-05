import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Briefcase, CheckCircle2, Handshake, Search, UserRound, UsersRound } from 'lucide-react';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'General Recruitment | Job Board',
  description: 'Mr Truth Agency recruits for every industry — driving, sales, admin, skilled trades, hospitality, tech and more. Employers post jobs, candidates get hired.'
};
export const dynamic = 'force-dynamic';

const categories = [
  'Driving & Logistics', 'Sales & Marketing', 'Customer Service', 'Admin & Office', 'Skilled Trades',
  'Hospitality & Tourism', 'Healthcare & Caregiving', 'Construction & Labour', 'Tech & Digital', 'Education & Training'
];

export default async function JobsPage() {
  const site = await getSiteSettings();
  const [opportunities, members, workApplications] = await Promise.all([
    db.driverOpportunity.findMany({ where: { status: 'OPEN' }, select: { id: true, title: true, description: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 12 }),
    db.member.count({ where: { status: 'APPROVED' } }),
    db.workApplication.count({})
  ]);

  return (
    <>
      <SiteHeader
        phone={site.contact_phone}
        email={site.contact_email}
        announcement={site.announcement_enabled === 'true' && site.announcement_text ? { text: site.announcement_text, key: announcementKey(site.announcement_text) } : null}
        socials={socialLinks(site)}
      />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">MR TRUTH AGENCY · GENERAL RECRUITMENT</p>
            <h1>Every job. One agency.</h1>
            <p>We recruit for <em>every</em> industry — not just driving. Whether you need a role filled or you&rsquo;re looking for work, our team finds the right match. Members apply free.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <Link href="/membership" className="btn btn-primary">JOIN FREE & APPLY <ArrowRight size={15} /></Link>
              <Link href="/contact?subject=recruitment" className="btn btn-outline">HIRE WITH US</Link>
            </div>
          </div>
        </section>

        <section className="container page-body">
          <div className="admin-dashboard-cards cards-3" style={{ marginBottom: 26 }}>
            <div className="admin-stat-card">
              <span className="admin-stat-icon"><Briefcase size={19} /></span>
              <strong>{opportunities.length}</strong>
              <span>Live opportunities</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-icon"><UsersRound size={19} /></span>
              <strong>{members.toLocaleString()}</strong>
              <span>Members in our talent pool</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-icon"><Handshake size={19} /></span>
              <strong>{workApplications.toLocaleString()}</strong>
              <span>Applications placed</span>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 26 }}>
            <p className="section-label">WE RECRUIT FOR EVERY INDUSTRY</p>
            <h2>Whatever the job, we can help.</h2>
            <p className="form-note">Sales, security, hospitality, construction, healthcare, teaching, admin, retail, tech and more — if you need staff, we source, screen and shortlist them. If you need work, we match you to openings across our agency network.</p>
            <div className="services-grid" style={{ marginTop: 14 }}>
              {categories.map((category) => (
                <div className="service-card" key={category} style={{ padding: '14px 18px' }}>
                  <CheckCircle2 size={16} color="var(--accent)" />
                  <h3 style={{ margin: '6px 0 0', fontSize: 15 }}>{category}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <p className="section-label">OPEN OPPORTUNITIES</p>
            <h2>Currently hiring</h2>
            {opportunities.length ? (
              <div className="services-grid" style={{ marginTop: 14 }}>
                {opportunities.map((opportunity) => (
                  <article className="service-card" key={opportunity.id}>
                    <span className="service-icon"><Briefcase size={20} /></span>
                    <h3>{opportunity.title}</h3>
                    <p>{opportunity.description}</p>
                    <Link href="/member/work" className="read">APPLY AS A MEMBER <ArrowRight size={13} /></Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="form-note">New opportunities open regularly. <Link href="/membership" className="admin-link">Join free</Link> and we&rsquo;ll notify you as soon as they do.</p>
            )}
            <p className="form-note" style={{ marginTop: 14 }}>
              <BadgeCheck size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Applications are a <strong>free member benefit</strong> — sign in to your dashboard to apply and track yours.
            </p>
            <Link href="/member/work" className="btn btn-primary">GO TO MEMBER PORTAL <ArrowRight size={14} /></Link>
          </div>

          <div className="split" style={{ marginTop: 26 }}>
            <article className="panel">
              <p className="section-label">FOR JOB SEEKERS</p>
              <h2>Get hired.</h2>
              <p className="form-note"><Search size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Join free and apply for roles across every industry.</p>
              <p className="form-note"><UserRound size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Upload your CV once — we keep it on file for matching.</p>
              <p className="form-note"><BadgeCheck size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Track every application and its status from your dashboard.</p>
              <Link href="/membership" className="btn btn-primary" style={{ marginTop: 8 }}>JOIN FREE <ArrowRight size={14} /></Link>
            </article>
            <article className="panel">
              <p className="section-label">FOR EMPLOYERS</p>
              <h2>Hire better.</h2>
              <p className="form-note"><CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Tell us the role — we handle sourcing, screening and shortlisting.</p>
              <p className="form-note"><Handshake size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Tap our pool of vetted members and beyond.</p>
              <p className="form-note"><BadgeCheck size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Fast, flexible and built around your needs.</p>
              <Link href="/contact?subject=recruitment" className="btn btn-primary" style={{ marginTop: 8 }}>POST A ROLE <ArrowRight size={14} /></Link>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
