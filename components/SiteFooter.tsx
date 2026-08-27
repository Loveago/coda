import Link from 'next/link';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import FloatingActions from '@/components/FloatingActions';

export default function SiteFooter({
  phone = '+233 24 123 4567',
  email = 'info@gacoda.org',
  whatsapp
}: {
  phone?: string;
  email?: string;
  whatsapp?: string;
}) {
  return (
    <>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand brand-invert">
              <img src="/logo-mark.png" alt="GACODA logo" className="brand-logo" width={51} height={51} />
              <div>
                <div className="brand-name">GACODA</div>
                <small className="brand-sub">GREATER ACCRA CONCERNED<br />ONLINE DRIVERS ASSOCIATION</small>
              </div>
            </div>
            <p>United drivers. Stronger voices. Safer roads. The collective voice of online drivers in Greater Accra.</p>
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
            <h3>JOIN OUR COMMUNITY</h3>
            <p>Be part of a growth-oriented community of professional online drivers.</p>
            <Link href="/membership" className="btn btn-primary">JOIN GACODA <ArrowRight size={14} /></Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Greater Accra Concerned Online Drivers Association. All rights reserved.</span>
          <span>Built for the drivers of Greater Accra.</span>
        </div>
      </footer>
      <FloatingActions whatsapp={whatsapp} />
    </>
  );
}
