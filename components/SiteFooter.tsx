import Link from 'next/link';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import FloatingActions from '@/components/FloatingActions';
import SocialIcon from '@/components/SocialIcon';
import type { SocialLink } from '@/lib/settings';

export default function SiteFooter({
  phone = '+233 24 123 4567',
  email = 'info@mrtruthagency.com',
  whatsapp,
  socials = []
}: {
  phone?: string;
  email?: string;
  whatsapp?: string;
  socials?: SocialLink[];
}) {
  return (
    <>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand brand-invert">
              <img src="/logo-mark.png" alt="Mr Truth Agency logo placeholder" className="brand-logo" width={51} height={51} />
              <div>
                <div className="brand-name">MR TRUTH</div>
                <small className="brand-sub">AGENCY · AUTOMOTIVE & MOBILITY</small>
              </div>
            </div>
            <p>Move people. Move business. Move forward. Automotive and mobility solutions for a moving Africa.</p>
          </div>
          <div>
            <h3>QUICK LINKS</h3>
            <Link href="/about">About Us</Link>
            <Link href="/membership">Membership</Link>
            <Link href="/membership-status">Check Application Status</Link>
            <Link href="/news">News & Updates</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/gallery">Gallery</Link>
          </div>
          <div>
            <h3>CONTACT US</h3>
            <p><Phone size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />{phone}</p>
            <p><Mail size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />{email}</p>
            <p><MapPin size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Accra, Ghana</p>
          </div>
          <div>
            <h3>MR TRUTH FAN CLUB</h3>
            <p>Join the community layer of the Mr Truth Agency ecosystem.</p>
            <Link href="/membership" className="btn btn-primary">JOIN FAN CLUB <ArrowRight size={14} /></Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Mr Truth Agency. All rights reserved.</span>
          {socials.length > 0 ? (
            <span className="footer-socials" aria-label="Mr Truth Agency on social media">
              {socials.map((social) => (
                <a key={social.key} href={social.url} target="_blank" rel="noreferrer me" aria-label={social.label}>
                  <SocialIcon platform={social.key} size={15} />
                </a>
              ))}
            </span>
          ) : (
            <span>Built for the people and businesses that keep Africa moving.</span>
          )}
        </div>
      </footer>
      <FloatingActions whatsapp={whatsapp} />
    </>
  );
}
