import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import FloatingActions from '@/components/FloatingActions';
import NewsletterForm from '@/components/NewsletterForm';
import SocialIcon from '@/components/SocialIcon';
import type { SocialLink } from '@/lib/settings';

const quickLinks = [
  ['About Us', '/about'],
  ['Our Services', '/services'],
  ['Vehicles', '/vehicles'],
  ['Membership', '/membership'],
  ['News & Updates', '/news'],
  ['Spare Parts', '/automotive'],
  ['Contact Us', '/contact']
];

const serviceLinks = [
  ['Driver Recruitment', '/services/driver-recruitment'],
  ['General Recruitment', '/jobs'],
  ['Property Management', '/services/property-management'],
  ['Property Rentals', '/services/property-rentals'],
  ['Airbnb & Short-Let', '/services/airbnb'],
  ['Fleet Management', '/services/fleet-management'],
  ['Car Rentals', '/rentals'],
  ['Vehicle Sales', '/vehicles'],
  ['Automotive Goods', '/automotive'],
  ['Cleaning Services', '/services/cleaning']
];

export default function SiteFooter({
  phone = '+233 234 123 4567',
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
              <img src="/logo-mark.png" alt="Mr Truth Agency logo" className="brand-logo" width={46} height={46} />
              <div>
                <div className="brand-name">MR TRUTH</div>
                <small className="brand-sub">AGENCY</small>
              </div>
            </div>
            <p>Your trusted partner for automotive, mobility and smart transportation solutions in Africa.</p>
            {socials.length > 0 && (
              <span className="footer-social-row" aria-label="Mr Truth Agency on social media">
                {socials.map((social) => (
                  <a key={social.key} href={social.url} target="_blank" rel="noreferrer me" aria-label={social.label}>
                    <SocialIcon platform={social.key} size={15} />
                  </a>
                ))}
              </span>
            )}
          </div>
          <div>
            <h3>Quick Links</h3>
            {quickLinks.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </div>
          <div>
            <h3>Our Services</h3>
            {serviceLinks.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </div>
          <div>
            <h3>Contact Us</h3>
            <p><Phone size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />{phone}</p>
            <p><Mail size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />{email}</p>
            <p><MapPin size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Accra, Ghana</p>
            <p className="footer-hours"><Clock size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Mon - Sat: 8:00am - 6:00pm</p>
          </div>
          <div className="footer-news">
            <h3>Newsletter</h3>
            <p>Subscribe to get updates and news from Mr Truth Agency.</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Mr Truth Agency. All rights reserved.</span>
          <span>Built for the people and businesses that keep Africa moving.</span>
        </div>
      </footer>
      <FloatingActions whatsapp={whatsapp} />
    </>
  );
}
