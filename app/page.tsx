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
export const metadata: Metadata = { title: 'GACODA | United Drivers. Stronger Voices. Safer Roads.', description: 'The collective voice of online drivers in Greater Accra, Ghana.' };

const values = [
  ['Unity', 'Uniting online drivers for a common purpose.', Users],
  ['Advocacy', 'Advocating for fair policies and better working conditions.', Megaphone],
  ['Support', 'Supporting members with resources and guidance.', HeartHandshake],
  ['Professionalism', 'Promoting professionalism and road safety at all times.', Award],
  ['Partnership', 'Building strong partnerships for growth and recognition.', Handshake],
  ['Safety', 'Promoting safer roads for drivers and the community.', ShieldCheck]
] as const;

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="kicker">GREATER ACCRA CONCERNED ONLINE DRIVERS ASSOCIATION</p>
          <h1>UNITED DRIVERS.<br /><em>STRONGER VOICES.</em><br />SAFER ROADS.</h1>
          <p>GACODA is the collective voice of online drivers in the Greater Accra Region. Together, we are building a safer, stronger and more professional future.</p>
          <div className="hero-actions">
            <Link href="/membership" className="btn btn-primary">JOIN OUR ASSOCIATION <ArrowRight size={15} /></Link>
            <Link href="/about" className="btn btn-outline">LEARN MORE</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orb">WE ARE<br />FOR EACH<br /><span>OTHER</span></div>
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
        <section className="container values">
          {values.map(([title, text, Icon], index) => (
            <Reveal key={title} delay={index * 70} className="value">
              <div className="value-icon"><Icon size={23} /></div>
              <h3>{title.toUpperCase()}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </section>
        <section className="container split">
          <Reveal className="about-card">
            <p className="kicker">ABOUT GACODA</p>
            <h2>Who We Are</h2>
            <p>GACODA represents the interests of online drivers in the Greater Accra Region. We work to improve road safety, encourage professionalism, and create a sustainable and respectful partnership between drivers, platforms, and public institutions.</p>
            <Link href="/about" className="btn btn-primary">MORE ABOUT US <ArrowRight size={14} /></Link>
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
              <h2>LATEST NEWS & UPDATES</h2>
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
