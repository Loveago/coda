'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';

export default function FloatingActions({ whatsapp }: { whatsapp?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="floating-actions">
      {whatsapp && (
        <a
          className="fab fab-whatsapp"
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Mr Truth Agency, I would like to make an enquiry.')}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Mr Truth Agency on WhatsApp"
        >
          <MessageCircle size={22} />
        </a>
      )}
      <button
        type="button"
        className={`fab fab-top${visible ? ' show' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        tabIndex={visible ? 0 : -1}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
