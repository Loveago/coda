'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Car, CarFront, ChevronDown, LogIn, Mail, MapPin, Megaphone, Menu, Phone, Sparkles, UserPlus, Wrench, X } from 'lucide-react';
import SocialIcon from '@/components/SocialIcon';
import type { SocialLink } from '@/lib/settings';

const links = [
  ['Home', '/'],
  ['About Us', '/about']
];

const serviceLinks = [
  ['All Services', '/services', ArrowRight],
  ['Driver Recruitment', '/services/driver-recruitment', UserPlus],
  ['Fleet Management', '/services/fleet-management', Car],
  ['Vehicles', '/vehicles', CarFront],
  ['Car Rentals', '/rentals', CarFront],
  ['Automotive Goods', '/automotive', Wrench],
  ['Cleaning Services', '/services/cleaning', Sparkles]
] as const;

const tailLinks = [
  ['Fan Club', '/membership'],
  ['News', '/news'],
  ['Contact Us', '/contact']
];

export default function SiteHeader({
  phone = '+233 234 123 4567',
  email = 'info@mrtruthagency.com',
  announcement,
  socials = []
}: {
  phone?: string;
  email?: string;
  announcement?: { text: string; key: string } | null;
  socials?: SocialLink[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    if (announcement) {
      setBannerDismissed(window.localStorage.getItem(`mrtruth-announcement-${announcement.key}`) === 'dismissed');
    }
  }, [announcement]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => { setOpen(false); setServicesOpen(false); }, [pathname]);

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const servicesActive = pathname.startsWith('/services') || pathname === '/vehicles' || pathname === '/rentals' || pathname === '/automotive';

  function dismiss() {
    if (announcement) window.localStorage.setItem(`mrtruth-announcement-${announcement.key}`, 'dismissed');
    setBannerDismissed(true);
  }

  return (
    <header>
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="top-meta">
            <span><Mail size={12} /> {email}</span>
            <span><Phone size={12} /> {phone}</span>
            <span className="hide-sm"><MapPin size={12} /> Accra, Ghana</span>
          </div>
          <div className="socials">
            <Link href="/login" className="hide-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, letterSpacing: '.4px' }}><LogIn size={12} /> SIGN IN</Link>
            {socials.map((social) => (
              <a key={social.key} href={social.url} target="_blank" rel="noreferrer me" aria-label={social.label}>
                <SocialIcon platform={social.key} />
              </a>
            ))}
          </div>
        </div>
      </div>
      {announcement && !bannerDismissed && (
        <div className="announce" role="status">
          <div className="container announce-inner">
            <Megaphone size={14} />
            <p>{announcement.text}</p>
            <button type="button" onClick={dismiss} aria-label="Dismiss announcement"><X size={15} /></button>
          </div>
        </div>
      )}
      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`} aria-label="Main navigation">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <img src="/logo-mark.png" alt="Mr Truth Agency logo" className="brand-logo" width={46} height={46} />
            <div>
              <div className="brand-name">MR TRUTH</div>
              <small className="brand-sub">AGENCY</small>
            </div>
          </Link>
          <div className="nav-links">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>{label}</Link>
            ))}
            <div className="nav-drop">
              <Link href="/services" className={servicesActive ? 'active' : ''} aria-expanded={servicesOpen} onFocus={() => setServicesOpen(true)} onBlur={() => setServicesOpen(false)}>
                Services <ChevronDown size={13} />
              </Link>
              <div className="nav-drop-menu">
                {serviceLinks.map(([label, href, Icon]) => (
                  <Link key={href} href={href}><Icon size={14} /> {label}</Link>
                ))}
              </div>
            </div>
            <Link href="/vehicles" className={isActive('/vehicles') ? 'active' : ''}>Vehicles</Link>
            {tailLinks.map(([label, href]) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>{label}</Link>
            ))}
          </div>
          <div className="nav-cta nav-actions">
            <Link className="btn btn-primary" href="/fan-club/join">JOIN FAN CLUB</Link>
          </div>
          <button
            type="button"
            className="menu-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>
      <div
        id="mobile-drawer"
        className={`drawer-backdrop${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open} aria-label="Mobile navigation">
        <p className="drawer-title">NAVIGATION</p>
        <nav className="drawer-links">
          {[...links, ...serviceLinks.map(([label, href]) => [label, href] as const), ...tailLinks].map(([label, href], index) => (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={isActive(href) ? 'active' : ''}
              style={{ transitionDelay: open ? `${80 + index * 30}ms` : '0ms' }}
              tabIndex={open ? 0 : -1}
            >
              {label}
              <ArrowRight size={16} />
            </Link>
          ))}
        </nav>
        <div className="drawer-cta drawer-actions">
          <Link href="/login" className="btn btn-ghost" tabIndex={open ? 0 : -1}><LogIn size={14} /> SIGN IN</Link>
          <Link href="/fan-club/join" className="btn btn-primary" tabIndex={open ? 0 : -1}>
            JOIN FAN CLUB <ArrowRight size={15} />
          </Link>
        </div>
        <div className="drawer-contact">
          <span><Phone size={13} /> {phone}</span>
          <span><Mail size={13} /> {email}</span>
        </div>
      </aside>
    </header>
  );
}
