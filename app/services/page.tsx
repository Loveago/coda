import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Car, CircuitBoard, Settings2, Sparkles, UsersRound } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore automotive, driver and mobility solutions from Mr Truth Agency.'
};

const services = [
  { title: 'Driver Recruitment', description: 'Connect qualified drivers with opportunities designed around professional service.', href: '/services/driver-recruitment', icon: UsersRound },
  { title: 'Fleet Management', description: 'Operational support for vehicle allocation, driver management and fleet performance.', href: '/services/fleet-management', icon: Settings2 },
  { title: 'Car Rentals', description: 'Flexible vehicle rental solutions for personal trips and business movement.', href: '/rentals', icon: Car },
  { title: 'Vehicle Sales', description: 'A clear, supported route to sourcing and purchasing vehicles.', href: '/vehicles', icon: BriefcaseBusiness },
  { title: 'Automotive Goods', description: 'Parts, equipment and automotive products structured for future online ordering.', href: '/automotive', icon: CircuitBoard },
  { title: 'Cleaning Services', description: 'Professional house, office and deep cleaning by vetted crews — one-time or recurring plans.', href: '/services/cleaning', icon: Sparkles }
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">MR TRUTH AGENCY</p>
            <h1>Mobility built around real movement.</h1>
            <p>Explore practical automotive, vehicle and driver solutions for people and businesses. Service details are structured for expansion as the agency grows.</p>
          </div>
        </section>
        <section className="container page-body">
          <div className="services-grid">
            {services.map(({ title, description, href, icon: Icon }) => (
              <article className="service-card" key={title}>
                <Icon size={24} color="var(--accent)" />
                <h3>{title}</h3>
                <p>{description}</p>
                <Link className="read" href={href}>EXPLORE SERVICE <ArrowRight size={13} /></Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
