import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Briefcase, CheckCircle2 } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Driver Recruitment',
  description: 'Explore driver opportunities and apply through Mr Truth Agency.'
};
export const dynamic = 'force-dynamic';

const requirements = ['Valid driving licence and required documentation', 'Professional communication and customer-service mindset', 'Relevant driving experience for the opportunity selected'];
const process = ['Join the Mr Truth Fan Club', 'Apply from your member dashboard', 'Our team reviews and contacts you'];

export default async function DriverRecruitmentPage() {
  const opportunities = await db.driverOpportunity.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 6 });
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">MR TRUTH AGENCY · PEOPLE IN MOTION</p>
            <h1>Driver opportunities, built around professionals.</h1>
            <p>Approved members apply for driving and fleet roles directly from their dashboard — track every application and its status in one place.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <Link href="/member/work" className="btn btn-primary">APPLY FROM MY DASHBOARD <ArrowRight size={15} /></Link>
              <Link href="/fan-club/join" className="btn btn-outline">BECOME A MEMBER</Link>
            </div>
          </div>
        </section>
        <section className="container page-body">
          <div className="form-grid">
            <article className="panel"><p className="section-label">WHAT TO EXPECT</p><h2>A clear recruitment path.</h2>{process.map((item, index) => <p key={item} className="form-note"><strong>{`0${index + 1}`}</strong> · {item}</p>)}</article>
            <article className="panel"><p className="section-label">CORE REQUIREMENTS</p><h2>Ready to move?</h2>{requirements.map((item) => <p key={item} className="form-note"><CheckCircle2 size={15} color="var(--accent)" style={{ verticalAlign: -3, marginRight: 7 }} />{item}</p>)}</article>
          </div>
          <div className="panel" style={{ marginTop: 20 }}>
            <p className="section-label">OPEN OPPORTUNITIES</p>
            <h2>Currently hiring</h2>
            {opportunities.length ? (
              <div className="services-grid" style={{ marginTop: 14 }}>
                {opportunities.map((opportunity) => (
                  <article className="service-card" key={opportunity.id} style={{ cursor: 'default' }}>
                    <span className="service-icon"><Briefcase size={20} /></span>
                    <h3>{opportunity.title}</h3>
                    <p>{opportunity.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="form-note">New roles open regularly. Become a member and we will notify you — members can also apply speculatively for any role they qualify for.</p>
            )}
            <p className="form-note" style={{ marginTop: 14 }}><Briefcase size={14} style={{ verticalAlign: -2, marginRight: 7 }} /> Applications are a <strong>member-only benefit</strong> — sign in to your dashboard to submit and track yours.</p>
            <Link href="/member/work" className="btn btn-primary">GO TO MEMBER PORTAL <ArrowRight size={14} /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
