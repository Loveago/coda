import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, Car, CarFront, Gauge, Handshake, Headphones, ShieldCheck, Sparkles, TicketCheck, Truck, UserPlus, Users, Wrench } from 'lucide-react';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import { formatGhs } from '@/lib/fees';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import StatsCounter from '@/components/StatsCounter';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mr Truth Agency | Automotive & Mobility', description: 'Automotive and mobility solutions for people, drivers and businesses.' };

const services = [
  ['Driver Recruitment', 'We connect skilled and reliable drivers with the right opportunities.', UserPlus, '/services/driver-recruitment'],
  ['Fleet Management', 'End-to-end fleet solutions that maximize performance and efficiency.', Truck, '/services/fleet-management'],
  ['Car Rentals', 'Quality vehicles for rent for business, leisure and everyday needs.', Car, '/rentals'],
  ['Vehicle Sales', 'Buy and sell quality new and used vehicles with confidence.', CarFront, '/vehicles'],
  ['Spare Parts', 'Genuine spare parts for all vehicle makes and models.', Wrench, '/automotive'],
  ['Automotive Goods', 'Wide range of automotive products and accessories you can trust.', Handshake, '/automotive'],
  ['Automotive Services', 'Professional maintenance, repairs and diagnostics you can rely on.', ShieldCheck, '/contact'],
  ['Corporate Mobility', 'Smart mobility solutions designed for businesses and organizations.', Building2, '/services']
] as const;

const perks = ['Exclusive Discounts', 'Priority Support', 'Community Access', 'Special Events'] as const;

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="hero-tag">WE MOVE PEOPLE. WE MOVE BUSINESS.</p>
          <h1>MOVING AFRICA<br /><em>FORWARD</em></h1>
          <p>Your trusted partner for automotive, mobility, and smart transportation solutions. From fleet operations to vehicle sourcing, we help people and businesses keep moving.</p>
          <div className="hero-actions">
            <Link href="/services" className="btn btn-primary">EXPLORE SERVICES <ArrowRight size={15} /></Link>
            <Link href="/fan-club/join" className="btn btn-outline">JOIN FAN CLUB</Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="hero-orb">TRUTH<br />IN<br /><span>MOTION</span></div>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [stats, featuredVehicles, settings] = await Promise.all([
    db.statistic.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' }, take: 4 }),
    db.vehicle.findMany({ where: { availability: { not: 'SOLD' } }, include: { images: { orderBy: { position: 'asc' }, take: 1 } }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }], take: 4 }),
    getSiteSettings()
  ]);

  const statIcons = [Users, CarFront, Building2, Headphones];

  return (
    <>
      <SiteHeader
        phone={settings.contact_phone}
        email={settings.contact_email}
        announcement={settings.announcement_enabled === 'true' && settings.announcement_text ? { text: settings.announcement_text, key: announcementKey(settings.announcement_text) } : null}
        socials={socialLinks(settings)}
      />
      <main>
        <Hero />
        <div className="container">
          <Reveal as="section" className="stats-strip" aria-label="Mr Truth Agency impact">
            {stats.map((stat, index) => {
              const Icon = statIcons[index % statIcons.length];
              return (
                <div className="stat" key={stat.id}>
                  <span className="stat-icon"><Icon size={21} /></span>
                  <div>
                    <strong><StatsCounter value={stat.value} /></strong>
                    <span>{stat.label}</span>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>

        <section className="container home-section" id="services">
          <Reveal className="home-head">
            <p className="kicker">WHAT WE DO</p>
            <h2>Our Services</h2>
            <p>Comprehensive automotive and mobility solutions tailored for individuals and businesses.</p>
          </Reveal>
          <div className="services-grid">
            {services.map(([title, text, Icon, href], index) => (
              <Reveal key={title} delay={index * 60} className="service-card">
                <span className="service-icon"><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link href={href} aria-label={`${title} — learn more`} className="service-link" />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="container home-section">
          <Reveal as="div" className="fanclub-banner">
            <div className="fanclub-card">
              <div className="idcard-face idcard-front" aria-hidden>
                <span className="idcard-band" />
                <div className="idcard-head">
                  <img src="/logo-mark.png" alt="" className="idcard-logo" width={34} height={34} />
                  <div>
                    <strong>MR TRUTH</strong>
                    <small>FAN CLUB</small>
                  </div>
                  <span className="idcard-valid-tag">MEMBER</span>
                </div>
                <div className="idcard-mid">
                  <div>
                    <p className="idcard-number" style={{ margin: 0 }}>MTFC 0001 2024</p>
                    <span className="idcard-platform"><Sparkles size={9} /> EXCLUSIVE ACCESS</span>
                  </div>
                </div>
                <div className="idcard-bottom">
                  <div className="idcard-thru"><small>VALID THRU</small><strong>31/08/2026</strong></div>
                  <span className="idcard-status-pill good">ACTIVE</span>
                </div>
              </div>
            </div>
            <div className="fanclub-copy">
              <p className="kicker">JOIN THE COMMUNITY</p>
              <h2>JOIN THE<br /><em>MR TRUTH FAN CLUB</em></h2>
              <p>Become part of our exclusive community and enjoy amazing benefits, offers and opportunities — built for drivers, riders and mobility lovers across Africa.</p>
              <div className="fanclub-perks">
                {perks.map((perk) => (
                  <span key={perk}><BadgeCheck size={16} /> {perk}</span>
                ))}
              </div>
              <Link href="/fan-club/join" className="btn btn-primary">JOIN THE FAN CLUB <ArrowRight size={15} /></Link>
            </div>
          </Reveal>
        </section>

        <section className="container home-section">
          <Reveal className="featured-head">
            <div>
              <p className="kicker" style={{ marginBottom: 0 }}>FEATURED</p>
              <h2>Featured Vehicles</h2>
              <p>Explore our handpicked quality vehicles</p>
            </div>
            <Link href="/vehicles" className="btn btn-ghost">VIEW ALL VEHICLES <ArrowRight size={14} /></Link>
          </Reveal>
          <div className="vehicle-grid">
            {featuredVehicles.length ? (
              featuredVehicles.map((vehicle, index) => (
                <Reveal as="article" key={vehicle.id} delay={index * 70} className="vehicle-card">
                  {vehicle.images[0] ? (
                    <img src={vehicle.images[0].url} alt={`${vehicle.make} ${vehicle.model}`} />
                  ) : (
                    <div className="vehicle-placeholder">MR TRUTH</div>
                  )}
                  <div className="vehicle-card-body">
                    <span className="vehicle-category">{vehicle.category}</span>
                    <h2>{vehicle.make} {vehicle.year}</h2>
                    <div className="vehicle-meta">
                      <span><Gauge size={13} /> {vehicle.transmission || '—'}</span>
                      <span><Car size={13} /> {vehicle.fuelType || '—'}</span>
                      <span><Users size={13} /> {vehicle.seats || '—'} seats</span>
                    </div>
                    <div className="vehicle-price">
                      <strong>{vehicle.price ? formatGhs(vehicle.price) : 'PRICE ON REQUEST'}</strong>
                      <Link href={`/contact?vehicle=${encodeURIComponent(`${vehicle.make} ${vehicle.model}`)}`} aria-label={`Request details about ${vehicle.make} ${vehicle.model}`}><ArrowRight size={15} /></Link>
                    </div>
                  </div>
                </Reveal>
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <h2>Vehicle listings are being prepared.</h2>
                <p>Contact Mr Truth Agency for sourcing support and upcoming availability.</p>
                <Link href="/contact" className="btn btn-primary" style={{ marginTop: 16 }}>CONTACT THE AGENCY <ArrowRight size={14} /></Link>
              </div>
            )}
          </div>
        </section>

        <section className="container home-section" style={{ paddingTop: 0 }}>
          <Reveal className="home-head">
            <p className="kicker">STAY CONNECTED</p>
            <h2>Agency Updates</h2>
            <p>News, announcements and stories from the Mr Truth Agency community.</p>
          </Reveal>
          <Link href="/news" className="btn btn-ghost" style={{ display: 'inline-flex', margin: '0 auto' }}><TicketCheck size={14} /> BROWSE ALL NEWS <ArrowRight size={14} /></Link>
        </section>
      </main>
      <SiteFooter phone={settings.contact_phone} email={settings.contact_email} whatsapp={settings.whatsapp_number} socials={socialLinks(settings)} />
    </>
  );
}
