'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, LogIn, Mail, MapPin, Megaphone, Menu, Phone, X } from 'lucide-react';
import SocialIcon from '@/components/SocialIcon';
import type { SocialLink } from '@/lib/settings';

const links = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Membership', '/membership'],
  ['News & Updates', '/news'],
  ['Resources', '/resources'],
  ['Gallery', '/gallery'],
  ['Contact Us', '/contact']
];

export default function SiteHeader({
  phone = '+233 24 123 4567',
  email = 'info@gacoda.org',
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
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    if (announcement) {
      setBannerDismissed(window.localStorage.getItem(`gacoda-announcement-${announcement.key}`) === 'dismissed');
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

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  function dismiss() {
    if (announcement) window.localStorage.setItem(`gacoda-announcement-${announcement.key}`, 'dismissed');
    setBannerDismissed(true);
  }

  return (
    <header>
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="top-meta">
            <span><Phone size={12} /> {phone}</span>
            <span><Mail size={12} /> {email}</span>
            <span className="hide-sm"><MapPin size={12} /> Accra, Ghana</span>
          </div>
          {socials.length > 0 && (
            <div className="socials">
              <span className="hide-sm">Follow us</span>
              {socials.map((social) => (
                <a key={social.key} href={social.url} target="_blank" rel="noreferrer me" aria-label={social.label}>
                  <SocialIcon platform={social.key} />
                </a>
              ))}
            </div>
          )}
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
            <img src="/logo-mark.png" alt="GACODA logo" className="brand-logo" width={51} height={51} />
            <div>
              <div className="brand-name">GACODA</div>
              <small className="brand-sub">GREATER ACCRA CONCERNED<br />ONLINE DRIVERS ASSOCIATION</small>
            </div>
          </Link>
          <div className="nav-links">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>{label.toUpperCase()}</Link>
            ))}
          </div>
          <div className="nav-cta nav-actions">
            <Link className="btn btn-ghost nav-signin" href="/login"><LogIn size={14} /> SIGN IN</Link>
            <Link className="btn btn-primary" href="/membership">JOIN GACODA <ArrowRight size={15} /></Link>
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
          {links.map(([label, href], index) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? 'active' : ''}
              style={{ transitionDelay: open ? `${80 + index * 40}ms` : '0ms' }}
              tabIndex={open ? 0 : -1}
            >
              {label}
              <ArrowRight size={16} />
            </Link>
          ))}
        </nav>
        <div className="drawer-cta drawer-actions">
          <Link href="/login" className="btn btn-ghost" tabIndex={open ? 0 : -1}><LogIn size={14} /> SIGN IN</Link>
          <Link href="/membership" className="btn btn-primary" tabIndex={open ? 0 : -1}>
            JOIN GACODA <ArrowRight size={15} />
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
