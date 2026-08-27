import type { Metadata } from 'next';
import { Award, Handshake, HeartHandshake, Megaphone, ShieldCheck, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { announcementKey, getSiteSettings } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import StatsCounter from '@/components/StatsCounter';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'About Us', description: 'Learn about GACODA — who we are, our purpose, values, mission, vision and leadership.' };

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
      />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">ABOUT GACODA</p>
            <h1>{setting.about_title || 'Who We Are'}</h1>
            <p>{setting.about_body || 'The Greater Accra Concerned Online Drivers Association (GACODA) is an association established to unite, represent, protect, and promote the welfare and interests of online drivers operating within the Greater Accra Region.'}</p>
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
              <strong>Greater Accra Concerned Online Drivers Association (GACODA)</strong> — <em>“We Are For Each Other.”</em>
            </p>
            <p>
              The Greater Accra Concerned Online Drivers Association (GACODA) is an association established to unite, represent, protect, and promote the welfare and interests of online drivers operating within the Greater Accra Region.
            </p>
            <p>
              Founded on 1st August 2025 by Daniel Adjetey Boye, GACODA was formed from the need for online drivers to come together as one organized body to address common challenges, promote professionalism, protect their rights, and create a safer, fairer, and more supportive working environment.
            </p>
            <p>
              As online driving continues to become an important part of Ghana’s transportation and digital economy, drivers face a number of challenges, including issues relating to safety, working conditions, fair treatment, platform policies, passenger relations, vehicle operations, and economic sustainability. GACODA seeks to provide a collective voice through which these concerns can be properly communicated, discussed, and addressed.
            </p>
          </Reveal>

          <Reveal className="about-section">
            <p className="section-label">OUR PURPOSE</p>
            <h2>Stronger Together</h2>
            <p>
              Our purpose is to promote the welfare and interests of online drivers, enhance their professionalism, and advocate for their rights and well-being.
            </p>
            <p>
              We believe that drivers are stronger when they stand together. Through unity, cooperation, education, advocacy, and mutual support, GACODA aims to ensure that every member has access to a community that understands their challenges and is willing to stand with them.
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
              <p style={{ lineHeight: 1.75, color: 'var(--muted)', margin: 0 }}>{setting.about_mission || 'Our mission is to unite online drivers, protect their legitimate interests, promote their welfare, encourage professionalism, provide support and education, and advocate for policies and practices that create a fair and sustainable working environment for drivers.'}</p>
            </Reveal>
            <Reveal delay={100} className="panel">
              <p className="section-label">OUR VISION</p>
              <p style={{ lineHeight: 1.75, color: 'var(--muted)', margin: 0 }}>{setting.about_vision || 'To become a strong, respected, and united association that represents the interests of online drivers and contributes meaningfully to the development of a safer, more professional, and sustainable online transportation industry in Ghana.'}</p>
            </Reveal>
          </div>

          <Reveal className="about-section">
            <p className="section-label">OUR COMMITMENT</p>
            <h2>Built on Responsibility</h2>
            <p>
              GACODA is committed to building a community where online drivers do not have to face challenges alone. We believe that collective action, open communication, responsible leadership, and cooperation with relevant stakeholders can create meaningful improvements in the lives and working conditions of drivers.
            </p>
            <p>
              We also recognize that a successful association must not only speak for its members but must encourage its members to uphold high standards themselves. We therefore promote responsible conduct, respect for the law, professionalism, road safety, and positive relationships with passengers, communities, transport authorities, and online service platforms.
            </p>
          </Reveal>

          <Reveal className="about-section">
            <p className="section-label">OUR FUTURE</p>
            <h2>Growing Stronger</h2>
            <p>
              GACODA aims to continue growing its membership and strengthening its organizational structure while developing programs and initiatives that directly benefit online drivers.
            </p>
            <p>
              As we grow, our focus will remain on representation, welfare, advocacy, safety, education, professionalism, and unity. We believe the future is stronger when we work together.
            </p>
          </Reveal>

          <Reveal className="about-motto">
            <p className="kicker">GREATER ACCRA CONCERNED ONLINE DRIVERS ASSOCIATION</p>
            <h2>GACODA</h2>
            <p>“We Are For Each Other.”</p>
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
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} />
    </>
  );
}
