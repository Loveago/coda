import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, CarFront, ClipboardCheck, MapPinned, Wrench } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = { title: 'Fleet Management', description: 'Fleet operations and mobility support from Mr Truth Agency.' };
const capabilities = [
  ['Fleet onboarding', 'Structure vehicles, drivers and operating requirements from day one.', ClipboardCheck],
  ['Driver management', 'Support assignment, communication and day-to-day driver operations.', CarFront],
  ['Maintenance management', 'Build visibility around servicing and vehicle readiness.', Wrench],
  ['Fleet reporting', 'Create a foundation for performance and operational reporting.', BarChart3],
  ['Vehicle allocation', 'Match vehicles to business needs, routes and responsibilities.', MapPinned]
] as const;

export default function FleetManagementPage() {
  return <><SiteHeader /><main><section className="page-hero"><div className="container"><p className="kicker">BUSINESS SOLUTIONS</p><h1>Fleet operations that stay in motion.</h1><p>Mr Truth Agency helps businesses establish clearer processes around vehicles, drivers and fleet performance.</p><Link href="/contact" className="btn btn-primary">TALK TO OUR TEAM <ArrowRight size={15} /></Link></div></section><section className="container page-body"><div className="services-grid">{capabilities.map(([title, text, Icon]) => <article className="service-card" key={title}><Icon size={24} color="var(--accent)" /><h3>{title}</h3><p>{text}</p></article>)}</div><article className="panel" style={{ marginTop: 22 }}><p className="section-label">BUILT TO EXPAND</p><h2>From operational support to connected fleet intelligence.</h2><p className="form-note">The fleet-management foundation is intentionally modular so future tracking integrations, maintenance records, allocations and reporting workflows can be added without replacing the core experience.</p></article></section></main><SiteFooter /></>;
}
