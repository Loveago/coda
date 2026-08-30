import type { Metadata } from 'next';
import { Award, Handshake, HeartHandshake, Megaphone, ShieldCheck, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import StatsCounter from '@/components/StatsCounter';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'About Us', description: 'Learn about Mr Truth Agency — our purpose, values, mission, vision and leadership.' };

const standFor = [
  ['Unity', 'We bring online drivers together as one community, regardless of the platform they operate on.', Users],
  ['Welfare', 'We are committed to promoting the social, economic, and professional well-being of our members.', HeartHandshake],
  ['Advocacy', 'We provide a collective voice for drivers and work to ensure that their legitimate concerns and interests are heard by relevant stakeholders.', Megaphone],
  ['Professionalism', 'We encourage responsible driving, excellent customer service, discipline, integrity, and respect for passengers and fellow road users.', Award],
  ['Safety', 'We promote a culture of safety for drivers, passengers, and other road users while encouraging members to adopt responsible driving practices.', ShieldCheck],
  ['Mutual Support', 'Our motto, “We Are For Each Other,” reflects our commitment to supporting members during challenges and celebrating their successes together.', Handshake]
] as const;

export default async function About() {
  const [team, stats, settingRows, site] = await Promise.all([
    db.teamMember.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } }),
    db.statistic.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' }, take: 4 }),
    db.siteSetting.findMany({ where: { key: { in: ['about_title', 'about_body', 'about_mission', 'about_vision'] } } }),
    getSiteSettings()
  ]);
  const setting = Object.fromEntries(settingRows.map((item) => [item.key, item.value]));

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
            <p className="kicker">ABOUT MR TRUTH AGENCY</p>
            <h1>{setting.about_title || 'Who We Are'}</h1>
            <p>{setting.about_body || 'Mr Truth Agency is an automotive and mobility company connecting drivers, vehicles and businesses to practical solutions across Ghana.'}</p>
          </div>
        </section>
        <section className="container page-body">
          <Reveal className="stats">
            {(stats.length ? stats : [
              { id: '1', value: 'UNITY', label: 'One collective voice' },
              { id: '2', value: 'SAFETY', label: 'Safer roads for all' },
              { id: '3', value: 'SUPPORT', label: 'Members first' },
              { id: '4', value: 'GROWTH', label: 'A stronger future' }
            ]).map((stat) => (
              <div className="stat" key={stat.id}>
                <StatsCounter value={stat.value} />
                <span>{stat.label}</span>
              </div>
            ))}
          </Reveal>

          <Reveal className="about-intro" delay={100}>
            <p>
              <strong>Mr Truth Agency</strong> — <em>“Move people. Move business. Move forward.”</em>
            </p>
            <p>
              We connect people, professional drivers, vehicles and businesses through dependable automotive and mobility services.
            </p>
            <p>
              Our work brings together vehicle sourcing, rentals, fleet support, driver opportunities and automotive goods in one practical ecosystem.
            </p>
            <p>
              We build clear pathways for movement: helping drivers find opportunities, helping businesses operate fleets, and helping customers access the right vehicles and support.
            </p>
          </Reveal>

          <Reveal className="about-section">
            <p className="section-label">OUR PURPOSE</p>
            <h2>Movement with meaning</h2>
            <p>
              Our purpose is to make automotive and mobility access more useful, transparent and human for drivers, customers and growing businesses.
            </p>
            <p>
              Through reliable service, responsible operations and a strong community layer, Mr Truth Agency helps every part of the mobility journey work better together.
            </p>
          </Reveal>

          <section className="about-section">
            <Reveal>
              <p className="section-label">WHAT WE STAND FOR</p>
              <h2 className="about-h2">Our Core Values</h2>
            </Reveal>
            <div className="about-values">
              {standFor.map(([title, text, Icon], index) => (
                <Reveal key={title} delay={index * 70} className="about-value">
                  <div className="value-icon"><Icon size={23} /></div>
                  <h3>{title.toUpperCase()}</h3>
                  <p>{text}</p>
                </Reveal>
              ))}
            </div>
          </section>

          <div className="split" style={{ marginTop: 54 }}>
            <Reveal className="panel">
              <p className="section-label">OUR MISSION</p>
              <p style={{ lineHeight: 1.75, color: 'var(--muted)', margin: 0 }}>{setting.about_mission || 'Our mission is to move people and business reliably — connecting individuals and organisations to practical automotive, mobility, driver and vehicle solutions delivered with honesty, professionalism and care.'}</p>
            </Reveal>
            <Reveal delay={100} className="panel">
              <p className="section-label">OUR VISION</p>
              <p style={{ lineHeight: 1.75, color: 'var(--muted)', margin: 0 }}>{setting.about_vision || 'To become the most trusted automotive and mobility partner in Ghana — a respected name in vehicle access, fleet operations, driver opportunities and automotive commerce, built around people in motion.'}</p>
            </Reveal>
          </div>

          <Reveal className="about-section">
            <p className="section-label">OUR COMMITMENT</p>
            <h2>Built on Responsibility</h2>
            <p>
              Mr Truth Agency is committed to dependable service, transparent communication and responsible participation in the automotive and mobility ecosystem.
            </p>
            <p>
              We promote professionalism, road safety, respect for customers and partners, and practical solutions that create lasting value for the people and businesses we serve.
            </p>
          </Reveal>

          <Reveal className="about-section">
            <p className="section-label">OUR FUTURE</p>
            <h2>Ready for what moves next</h2>
            <p>
              We are building a trusted platform for vehicle access, fleet operations, driver opportunities and automotive commerce.
            </p>
            <p>
              As the agency grows, our focus will remain on clarity, quality, safety, innovation and the communities that keep Africa moving.
            </p>
          </Reveal>

          <Reveal className="about-motto">
            <p className="kicker">MR TRUTH AGENCY · AUTOMOTIVE & MOBILITY</p>
            <h2>MR TRUTH</h2>
            <p>“Move people. Move business. Move forward.”</p>
          </Reveal>

          {team.length > 0 && (
            <section style={{ marginTop: 54 }}>
              <Reveal><p className="section-label">LEADERSHIP</p></Reveal>
              <div className="news-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {team.map((member, index) => (
                  <Reveal as="article" delay={index * 80} key={member.id}>
                    <article className="news-card">
                      {member.imageUrl && <div className="news-img" style={{ backgroundImage: `url(${member.imageUrl})` }} />}
                      <div className="news-body">
                        <span className="news-date">{member.position}</span>
                        <h3>{member.name}</h3>
                        {member.biography && <p>{member.biography}</p>}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
