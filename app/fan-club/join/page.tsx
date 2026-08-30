import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CreditCard, ShieldCheck, UsersRound } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { getFees } from '@/lib/fees';

export const metadata: Metadata = { title: 'Mr Truth Fan Club', description: 'Join the Mr Truth Fan Club community.' };

const features = [
  ['Member identity', 'A dedicated profile and membership experience inside the Mr Truth ecosystem.', UsersRound],
  ['Community access', 'Stay connected to relevant updates, opportunities and community activity.', ShieldCheck],
  ['Automotive offers', 'Receive access to offers and updates as they are officially introduced.', CreditCard],
  ['Member events', 'Discover events and community moments when they become available.', CalendarDays]
] as const;

export default async function FanClubJoinPage() {
  const fees = await getFees();
  return <><SiteHeader /><main><section className="page-hero"><div className="container"><p className="kicker">MR TRUTH FAN CLUB</p><h1>Join the community in motion.</h1><p>The Fan Club is the community layer of Mr Truth Agency — bringing people connected to automotive, mobility and the wider Mr Truth ecosystem into one member experience.</p><Link href="#join" className="btn btn-primary">START YOUR APPLICATION <ArrowRight size={15} /></Link></div></section><section className="container page-body"><div className="services-grid">{features.map(([title, text, Icon]) => <article className="service-card" key={title}><Icon size={24} color="var(--accent)" /><h3>{title}</h3><p>{text}</p></article>)}</div><article className="panel" id="join" style={{ marginTop: 22 }}><p className="section-label">MEMBERSHIP APPLICATION</p><h2>Your member journey starts here.</h2><p className="form-note">Create your account and complete the existing secure application workflow. The current configurable registration fee is <strong>GHS {fees.registrationFeeEnabled ? fees.registrationFeeAmount : 0}</strong>; annual dues are managed by the agency and shown in your member portal.</p><Link href="/membership" className="btn btn-primary">CONTINUE TO REGISTRATION <ArrowRight size={15} /></Link></article></section></main><SiteFooter /></>;
}
