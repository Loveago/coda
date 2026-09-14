import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Car,
  CarFront,
  CheckCircle2,
  FileCheck2,
  FileSignature,
  FileText,
  KeyRound,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { announcementKey, getSiteSettings, socialLinks } from '@/lib/settings';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Reveal from '@/components/Reveal';
import WorkPayCalculator from '@/components/WorkPayCalculator';
import { SAMPLE_VEHICLES } from '@/lib/work-pay';
import '../globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Work & Pay Ghana | Commercial Vehicle Ownership Program | Mr Truth Agency',
  description: 'Drive your own taxi or ride-hailing car with Mr Truth Agency Work & Pay Ghana. Fixed weekly payments, transparent terms, and full DVLA title transfer to the driver at completion.'
};

const steps = [
  {
    num: '01',
    title: 'Apply Online & Screening',
    description: 'Submit your personal information, Ghana Card, driving license (Class B or C), and commercial driving background through our multi-step portal.',
    icon: FileText
  },
  {
    num: '02',
    title: 'In-person Interview & Vetting',
    description: 'Attend our vetting center for a physical driving assessment, background verification, guarantor confirmation, and mechanical interview.',
    icon: Users
  },
  {
    num: '03',
    title: 'Security Deposit & Contract Signing',
    description: 'Review transparent legal terms, lock in your weekly remittance schedule, pay your refundable security deposit, and execute the official agreement.',
    icon: FileSignature
  },
  {
    num: '04',
    title: 'Vehicle Handover',
    description: 'Receive a fully serviced, insured, and tracked vehicle with an exhaustive condition report and handover mileage sign-off.',
    icon: KeyRound
  },
  {
    num: '05',
    title: 'Weekly Remittance',
    description: 'Operate independently on Bolt, Uber, Yango, or commercial stations. Remit your fixed weekly payment seamlessly via Paystack Mobile Money or Card.',
    icon: Repeat
  },
  {
    num: '06',
    title: 'Ownership Transfer at DVLA',
    description: 'Upon completing all installments and terms, Mr Truth Agency executes formal DVLA title and registration transfer to your name with a completion certificate.',
    icon: ShieldCheck
  }
];

const eligibility = [
  { title: 'Valid Ghana Driver’s License', desc: 'Class B, C, or higher with at least 2 years validity remaining.' },
  { title: 'Commercial Driving Experience', desc: 'Minimum 2 years verifiable commercial driving, taxi, or ride-hailing (Bolt/Uber/Yango).' },
  { title: 'National Ghana Card', desc: 'Valid national identification card required for biometrics and vetting.' },
  { title: '2 Credible Guarantors', desc: 'Two gainfully employed or property-owning guarantors resident in Ghana.' },
  { title: 'Clean Driving & Police Record', desc: 'Zero record of reckless driving, major traffic violations, or criminal background.' },
  { title: 'Proof of Residence', desc: 'Recent utility bill or verified residential address in the operating region.' }
];

const faqs = [
  [
    'What is Work & Pay in Ghana?',
    'Work & Pay is a trusted vehicle financing and ownership model where commercial drivers operate a vehicle (such as a ride-hailing car, taxi, or delivery van), make agreed weekly remittances, and upon completing the contract terms, the vehicle ownership is legally transferred 100% to the driver.'
  ],
  [
    'How is Work & Pay different from a normal driver job?',
    'In a regular hired driver job (under our /jobs section), the driver is an employee who receives a salary or percentage, and the vehicle remains agency property forever. In Work & Pay, every payment you make goes toward buying the car for yourself. When the contract ends, the car is legally yours.'
  ],
  [
    'What happens if I experience vehicle breakdown?',
    'All handover vehicles undergo an 80-point mechanical inspection before assignment. Handover includes valid insurance, roadworthiness certificate, and tracker. Routine maintenance responsibilities are clearly outlined in the agreement, with agency assistance for major mechanical warranties.'
  ],
  [
    'Can I pay off my car early?',
    'Yes! Drivers can make advance payments or settle their balance early at any point with zero early-payoff penalties. Paying off early grants you immediate ownership transfer.'
  ],
  [
    'How do I pay my weekly installments?',
    'Drivers can pay directly from their phone using Mobile Money (MTN MoMo, Telecel Cash, AT Money) or debit/credit card via our integrated Paystack driver portal. Receipts and balance updates are generated in real-time.'
  ],
  [
    'What happens at the end of the contract?',
    'Once your final installment is verified, Mr Truth Agency signs over all official DVLA vehicle ownership documents, issues your Program Completion Certificate, and coordinates DVLA title transfer to your name.'
  ]
] as const;

export default async function WorkAndPayPage() {
  const site = await getSiteSettings();

  return (
    <>
      <SiteHeader
        phone={site.contact_phone}
        email={site.contact_email}
        announcement={site.announcement_enabled === 'true' && site.announcement_text ? { text: site.announcement_text, key: announcementKey(site.announcement_text) } : null}
        socials={socialLinks(site)}
      />
      <main>
        {/* Hero Section */}
        <section className="page-hero" style={{ background: 'linear-gradient(135deg, #091220 0%, #172554 100%)', color: '#fff', padding: '64px 0 52px' }}>
          <div className="container" style={{ maxWidth: 1100 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, letterSpacing: '.5px', color: '#93c5fd', marginBottom: 16 }}>
              <Sparkles size={13} />
              <span>MR TRUTH AGENCY · VEHICLE OWNERSHIP PROGRAM</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px', maxWidth: 840, color: '#fff' }}>
              Drive with purpose. Own your vehicle in Ghana.
            </h1>
            <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.6, maxWidth: 740, margin: '0 0 28px' }}>
              Work &amp; Pay is a life-changing vehicle ownership pathway. Operate high-demand commercial vehicles for Bolt, Uber, or taxi stations, make transparent weekly remittances, and become the full DVLA title owner.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/work-and-pay/apply" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CarFront size={18} />
                APPLY FOR WORK &amp; PAY
              </Link>
              <Link href="/work-and-pay/track" className="btn btn-ghost" style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: '#fff', borderColor: '#475569', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Search size={16} />
                TRACK APPLICATION
              </Link>
            </div>
          </div>
        </section>

        <section className="container page-body" style={{ maxWidth: 1100, paddingBottom: 80 }}>
          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: -24, position: 'relative', zIndex: 10 }}>
            <div className="panel" style={{ textAlign: 'center', padding: 18, borderTop: '4px solid #2563eb' }}>
              <strong style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>104 - 156</strong>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>WEEKS DURATION (~2-3 YRS)</p>
            </div>
            <div className="panel" style={{ textAlign: 'center', padding: 18, borderTop: '4px solid #10b981' }}>
              <strong style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>100%</strong>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>DVLA TITLE TRANSFER</p>
            </div>
            <div className="panel" style={{ textAlign: 'center', padding: 18, borderTop: '4px solid #f59e0b' }}>
              <strong style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>MoMo &amp; Card</strong>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>SEAMLESS PAYSTACK REMITTANCE</p>
            </div>
            <div className="panel" style={{ textAlign: 'center', padding: 18, borderTop: '4px solid #6366f1' }}>
              <strong style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>0%</strong>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>EARLY PAYOFF PENALTY</p>
            </div>
          </div>

          {/* Interactive Calculator */}
          <section style={{ marginTop: 48 }}>
            <Reveal>
              <WorkPayCalculator />
            </Reveal>
          </section>

          {/* Step by Step Breakdown */}
          <section style={{ marginTop: 64 }}>
            <Reveal>
              <p className="kicker" style={{ color: 'var(--blue)' }}>THE JOURNEY TO OWNERSHIP</p>
              <h2 style={{ fontSize: 28, margin: '4px 0 12px', fontWeight: 800 }}>6 Clear Steps to Vehicle Ownership</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 680, margin: '0 0 28px' }}>
                We believe in total transparency. Every stage of your application, handover, remittance, and ownership transfer is clearly documented with legal contracts and audit trails.
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <Reveal key={s.num} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#94a3b8' }}>{s.num}</span>
                      <span style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} />
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{s.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.description}</p>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* Sample Vehicles Table */}
          <section style={{ marginTop: 64 }}>
            <Reveal>
              <p className="kicker" style={{ color: 'var(--blue)' }}>AVAILABLE MODELS</p>
              <h2 style={{ fontSize: 28, margin: '4px 0 12px', fontWeight: 800 }}>Sample Vehicle Models &amp; Terms</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 680, margin: '0 0 24px' }}>
                All vehicles are vetted for high fuel economy, readily available spare parts in Ghana, and high ride-hailing eligibility.
              </p>
            </Reveal>

            <div className="panel" style={{ overflowX: 'auto', padding: 0 }}>
              <table className="admin-table" style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>VEHICLE MODEL</th>
                    <th>YEAR</th>
                    <th>CATEGORY</th>
                    <th>FUEL ECONOMY</th>
                    <th>TARGET BUYOUT</th>
                    <th>SECURITY DEPOSIT</th>
                    <th>WEEKLY REMITTANCE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_VEHICLES.map((car) => {
                    const financed = car.totalPrice - car.minDeposit;
                    const weekly = Math.ceil(financed / car.defaultDurationWeeks);
                    return (
                      <tr key={car.name}>
                        <td><strong>{car.name}</strong></td>
                        <td>{car.year}</td>
                        <td>{car.category}</td>
                        <td>{car.fuelEconomy}</td>
                        <td><strong>GHS {car.totalPrice.toLocaleString()}</strong></td>
                        <td style={{ color: '#059669' }}>GHS {car.minDeposit.toLocaleString()}</td>
                        <td style={{ color: '#2563eb' }}><strong>GHS {weekly.toLocaleString()} / wk</strong></td>
                        <td>
                          <Link
                            href={`/work-and-pay/apply?vehicle=${encodeURIComponent(car.name)}`}
                            className="btn btn-primary"
                            style={{ fontSize: 11, padding: '5px 12px' }}
                          >
                            SELECT →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Eligibility Requirements */}
          <section style={{ marginTop: 64 }}>
            <Reveal>
              <p className="kicker" style={{ color: 'var(--blue)' }}>REQUIREMENTS</p>
              <h2 style={{ fontSize: 28, margin: '4px 0 12px', fontWeight: 800 }}>Eligibility &amp; Verification Criteria</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 680, margin: '0 0 24px' }}>
                To maintain vehicle safety and integrity, all prospective drivers must satisfy the following minimum requirements:
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {eligibility.map((item) => (
                <div key={item.title} className="panel" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: 14, display: 'block', marginBottom: 2 }}>{item.title}</strong>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Two Pathways: Work & Pay vs Daily Sales */}
          <section style={{ marginTop: 64 }}>
            <Reveal>
              <p className="kicker" style={{ color: 'var(--blue)' }}>CHOOSE YOUR PATHWAY</p>
              <h2 style={{ fontSize: 28, margin: '4px 0 12px', fontWeight: 800 }}>Work &amp; Pay vs. Daily Sales: Which is Right for You?</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 680, margin: '0 0 24px' }}>
                We offer two flexible commercial driving models to suit your financial goals, capital capacity, and long-term career plans in Ghana.
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Card 1: Work & Pay */}
              <div className="panel" style={{ padding: 24, borderTop: '4px solid #2563eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-block', background: '#eff6ff', color: 'var(--blue)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
                    PATHWAY A · DRIVE-TO-OWN
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Work &amp; Pay (Hire Purchase)</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
                    Ideal for drivers who want to own the vehicle permanently. Every weekly installment pays down your vehicle purchase balance until complete ownership.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#334155', lineHeight: 1.8 }}>
                    <li><strong>Ownership:</strong> 100% DVLA Title transferred to you at end of term</li>
                    <li><strong>Remittance:</strong> Fixed weekly payment (typically GHS 800 - GHS 1,100 / wk)</li>
                    <li><strong>Duration:</strong> 104 to 156 weeks (~2 - 3 years)</li>
                    <li><strong>Security Deposit:</strong> Higher initial security deposit (e.g. GHS 5,000 - 8,000)</li>
                    <li><strong>Early Payoff:</strong> 0% penalty — pay faster to own earlier</li>
                  </ul>
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  <Link href="/work-and-pay/apply" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', fontSize: 13 }}>
                    APPLY FOR WORK &amp; PAY →
                  </Link>
                </div>
              </div>

              {/* Card 2: Daily Sales */}
              <div className="panel" style={{ padding: 24, borderTop: '4px solid #d97706', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-block', background: '#fffbeb', color: '#b45309', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
                    PATHWAY B · COMMERCIAL RENTAL
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Daily Sales (Sales Quota)</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
                    Ideal for drivers who prefer lower initial capital commitment and maximum daily earnings. Remit an agreed daily quota (6 days a week) and keep all surplus profits.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#334155', lineHeight: 1.8 }}>
                    <li><strong>Ownership:</strong> Vehicle remains with Agency / Fleet Investor</li>
                    <li><strong>Remittance:</strong> Fixed daily sales rate (typically GHS 140 - GHS 180 / day)</li>
                    <li><strong>Schedule:</strong> 6 days/week (Monday – Saturday; Sunday is driver’s rest/maintenance day)</li>
                    <li><strong>Security Deposit:</strong> Lower deposit (typically GHS 1,800 - GHS 2,500)</li>
                    <li><strong>Surplus Income:</strong> Everything you make above the daily quota is 100% yours</li>
                  </ul>
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                  <Link href="/work-and-pay/apply" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center', fontSize: 13, borderColor: '#d97706', color: '#b45309' }}>
                    APPLY FOR DAILY SALES →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Section for Fleet Owners / Car Investors */}
          <section style={{ marginTop: 64, padding: 32, background: '#faf5ff', borderRadius: 12, border: '1px solid #e9d5ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ maxWidth: 640 }}>
                <div style={{ display: 'inline-block', background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 8 }}>
                  FLEET INVESTORS &amp; PRIVATE CAR OWNERS
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#581c87' }}>
                  Have a Car in Ghana? Let Mr Truth Agency Manage It for You.
                </h3>
                <p style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                  Avoid the stress of rogue drivers, unpaid sales, and neglected repairs. Onboard your vehicle into our managed fleet. We provide 24/7 GPS tracking, thoroughly vetted commercial drivers, automated weekly remittances to your bank/MoMo, and routine maintenance oversight. You choose whether your car goes out as <strong>Daily Sales</strong> or <strong>Work &amp; Pay</strong>.
                </p>
              </div>
              <Link href="/contact" className="btn btn-primary" style={{ background: '#7e22ce', borderColor: '#7e22ce', padding: '12px 24px', fontSize: 13, fontWeight: 700 }}>
                ONBOARD YOUR VEHICLE →
              </Link>
            </div>
          </section>

          {/* FAQ Section */}
          <section style={{ marginTop: 64 }}>
            <Reveal>
              <p className="kicker" style={{ color: 'var(--blue)' }}>QUESTIONS &amp; ANSWERS</p>
              <h2 style={{ fontSize: 28, margin: '4px 0 12px', fontWeight: 800 }}>Frequently Asked Questions</h2>
            </Reveal>
            <div className="faq" style={{ marginTop: 20 }}>
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Bottom Call to Action */}
          <section style={{ marginTop: 64, padding: 36, background: '#1e293b', color: '#fff', borderRadius: 12, textAlign: 'center' }}>
            <h2 style={{ color: '#fff', margin: '0 0 10px', fontSize: 28, fontWeight: 800 }}>
              Ready to take the driver’s seat of your future?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 600, margin: '0 auto 24px' }}>
              Applications are reviewed on a rolling basis. Complete your online application in less than 5 minutes.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/work-and-pay/apply" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 14, fontWeight: 700 }}>
                APPLY FOR WORK &amp; PAY NOW
              </Link>
              <Link href="/contact" className="btn btn-ghost" style={{ padding: '14px 24px', fontSize: 14, color: '#fff', borderColor: '#475569' }}>
                TALK TO AN ADVISOR
              </Link>
            </div>
          </section>
        </section>
      </main>
      <SiteFooter phone={site.contact_phone} email={site.contact_email} whatsapp={site.whatsapp_number} socials={socialLinks(site)} />
    </>
  );
}
