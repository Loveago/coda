import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { ArrowRight, Bell, Building2, Handshake, HeartHandshake, Megaphone, Award, ShieldCheck, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import StatsCounter from '@/components/StatsCounter';
import NewsletterForm from '@/components/NewsletterForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mr Truth Agency | Automotive & Mobility', description: 'Automotive and mobility solutions for people, drivers and businesses.' };

const values = [
  ['Driver Recruitment', 'Connect with opportunities built around professional drivers.', Users],
  ['Fleet Management', 'Keep vehicles, drivers and operations moving efficiently.', Building2],
  ['Car Rentals', 'Flexible vehicle access for individuals and businesses.', ShieldCheck],
  ['Vehicle Sales', 'Source the right vehicle with confidence and clarity.', Award],
  ['Automotive Goods', 'Access practical parts, products and equipment.', Handshake],
  ['Corporate Mobility', 'Mobility solutions designed for growing businesses.', Megaphone]
] as const;

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="kicker">MR TRUTH AGENCY · AUTOMOTIVE & MOBILITY</p>
          <h1>MOVE PEOPLE.<br /><em>MOVE BUSINESS.</em><br />MOVE FORWARD.</h1>
          <p>Automotive, driver and mobility solutions built for the way Africa moves. From fleet operations to vehicle sourcing, we help people and businesses keep moving.</p>
          <div className="hero-actions">
            <Link href="#services" className="btn btn-primary">EXPLORE SERVICES <ArrowRight size={15} /></Link>
            <Link href="/membership" className="btn btn-outline">JOIN FAN CLUB</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orb">TRUTH<br />IN<br /><span>MOTION</span></div>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [stats, articles, settings] = await Promise.all([
    db.statistic.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' }, take: 4 }),
    db.newsArticle.findMany({ where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take: 3 }),
    getSiteSettings()
  ]);

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
        <section className="container values" id="services">
          {values.map(([title, text, Icon], index) => (
            <Reveal key={title} delay={index * 70} className="value">
              <div className="value-icon"><Icon size={23} /></div>
              <h3>{title.toUpperCase()}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </section>
        <section className="container services-grid" aria-label="Mr Truth Agency services">
          {values.map(([title, text, Icon]) => (
            <Reveal key={`service-${title}`} className="service-card">
              <Icon size={22} color="var(--accent)" />
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </section>
        <section className="container split">
          <Reveal className="about-card">
            <p className="kicker">WHAT WE DO</p>
            <h2>Mobility, without the friction.</h2>
            <p>Mr Truth Agency is an automotive and mobility company connecting drivers, vehicles and businesses to practical solutions. Explore vehicle sourcing, fleet support, rentals, automotive goods and the people who keep movement alive.</p>
            <Link href="/about" className="btn btn-primary">DISCOVER THE AGENCY <ArrowRight size={14} /></Link>
          </Reveal>
          <Reveal delay={120} className="stats">
            {stats.map((stat) => (
              <div className="stat" key={stat.id}>
                <Building2 size={24} />
                <StatsCounter value={stat.value} />
                <span>{stat.label}</span>
              </div>
            ))}
          </Reveal>
        </section>
        <section className="container news-section">
          <Reveal>
            <div className="section-head">
              <h2>INSIDE THE AGENCY</h2>
              <Link href="/news">VIEW ALL NEWS <ArrowRight size={14} /></Link>
            </div>
          </Reveal>
          <div className="news-grid">
            {articles.map((item, index) => (
              <Reveal as="article" delay={index * 90} key={item.id}>
                <article className="news-card">
                  <div className="news-img" style={{ backgroundImage: `url(${item.coverImage || 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=700&q=80'})` }} />
                  <div className="news-body">
                    <span className="news-date">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(item.publishedAt || item.createdAt)}</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <Link className="read" href={`/news/${item.slug}`}>READ MORE <ArrowRight size={12} /></Link>
                  </div>
                </article>
              </Reveal>
            ))}
            <Reveal as="div" delay={270}>
              <div className="newsletter">
                <Bell size={27} />
                <h3>Stay informed.<br />Stay ahead.</h3>
                <p>Get the latest news, updates and important announcements.</p>
                <NewsletterForm />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter phone={settings.contact_phone} email={settings.contact_email} whatsapp={settings.whatsapp_number} socials={socialLinks(settings)} />
    </>
  );
}
