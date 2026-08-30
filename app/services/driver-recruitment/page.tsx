import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Driver Recruitment',
  description: 'Explore driver opportunities and apply through Mr Truth Agency.'
};

const requirements = ['Valid driving licence and required documentation', 'Professional communication and customer-service mindset', 'Relevant driving experience for the opportunity selected'];
const process = ['Create your application', 'Our team reviews your details', 'Suitable applicants are contacted for next steps'];

export default function DriverRecruitmentPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero"><div className="container"><p className="kicker">MR TRUTH AGENCY · PEOPLE IN MOTION</p><h1>Driver opportunities, built around professionals.</h1><p>Register your interest in future and current driver opportunities. Requirements and role details are confirmed during recruitment.</p><Link href="#apply" className="btn btn-primary">APPLY NOW <ArrowRight size={15} /></Link></div></section>
        <section className="container page-body" id="apply">
          <div className="form-grid">
            <article className="panel"><p className="section-label">WHAT TO EXPECT</p><h2>A clear recruitment path.</h2>{process.map((item, index) => <p key={item} className="form-note"><strong>{`0${index + 1}`}</strong> · {item}</p>)}</article>
            <article className="panel"><p className="section-label">CORE REQUIREMENTS</p><h2>Ready to move?</h2>{requirements.map((item) => <p key={item} className="form-note"><CheckCircle2 size={15} color="var(--accent)" style={{ verticalAlign: -3, marginRight: 7 }} />{item}</p>)}</article>
          </div>
          <div className="panel" style={{ marginTop: 20 }}><p className="section-label">APPLICATIONS</p><h2>Applications are opening soon.</h2><p className="form-note">This foundation is ready to connect to the secure, database-backed recruitment application workflow. Contact the agency to request application availability.</p><Link href="/contact" className="btn btn-primary">CONTACT THE AGENCY <ArrowRight size={15} /></Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
