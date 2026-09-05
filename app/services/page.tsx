import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BedDouble, Briefcase, BriefcaseBusiness, Building2, Car, CircuitBoard, Home, Settings2, Sparkles, UsersRound } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore automotive, property, recruitment and mobility solutions from Mr Truth Agency.'
};

const services = [
  { title: 'Driver Recruitment', description: 'Connect qualified drivers with opportunities designed around professional service.', href: '/services/driver-recruitment', icon: UsersRound },
  { title: 'General Recruitment', description: 'We recruit for every industry — sales, admin, skilled trades, hospitality, tech and more. If you need staff or work, we can help.', href: '/jobs', icon: Briefcase },
  { title: 'Property Management', description: 'Tenant sourcing, rent collection, maintenance and reporting — we run the day-to-day so you enjoy the returns.', href: '/services/property-management', icon: Building2 },
  { title: 'Property Rentals', description: 'Verified homes, apartments, offices and commercial spaces to rent with honest terms and support throughout.', href: '/services/property-rentals', icon: Home },
  { title: 'Airbnb & Short-Let Hosting', description: 'We list, price, clean and host your property on Airbnb — you collect the income.', href: '/services/airbnb', icon: BedDouble },
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
            <h1>Everything you need. One agency.</h1>
            <p>Automotive, mobility, property and recruitment — practical services for people and businesses, delivered by one trusted team.</p>
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
