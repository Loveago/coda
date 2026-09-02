'use client';

import { FormEvent, useState } from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * The contact form now delivers messages through WhatsApp: the visitor types
 * their message, and the button opens WhatsApp (app or web) with everything
 * pre-filled and addressed to the agency. A copy is also archived to the
 * database (best-effort) so the admin inbox keeps a record of enquiries.
 */
export default function ContactForm({ whatsapp }: { whatsapp?: string }) {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const name = String(values.name || '').trim();
    const phone = String(values.phone || '').trim();
    const subject = String(values.subject || '').trim();
    const message = String(values.message || '').trim();

    // Archive a copy in the admin inbox — never blocks the WhatsApp redirect.
    const archive = fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, subject, message, website: '' })
    }).catch(() => null);

    const text = [
      `*${subject || 'Website enquiry'}*`,
      '',
      message,
      '',
      `— ${name}${phone ? ` · ${phone}` : ''}`,
      '(sent from the Mr Truth Agency contact form)'
    ].join('\n');

    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      setStatus({ ok: true, text: 'WhatsApp should have opened with your message — just press send there. We usually reply within a few minutes.' });
    } else {
      setStatus({ ok: false, text: 'WhatsApp is not configured for the agency yet. Please call or email us instead.' });
    }

    await archive;
    form.reset();
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="panel" style={{ display: 'grid', gap: 14 }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', margin: 0 }}>
        <MessageCircle size={15} style={{ color: '#25D366' }} />
        Type your message below — the button opens <strong>&nbsp;WhatsApp&nbsp;</strong> with it ready to send.
      </p>
      <div className="form-grid">
        <input name="name" required placeholder="Your name" className="field" aria-label="Your name" />
        <input name="phone" type="tel" placeholder="Phone number (optional)" className="field" aria-label="Phone number" />
        <input name="subject" required placeholder="Subject" className="field" aria-label="Subject" />
      </div>
      <textarea name="message" required rows={6} placeholder="Your message" className="field" aria-label="Your message" />
      <input type="text" name="website" value="" hidden readOnly aria-hidden="true" tabIndex={-1} />
      <button className="btn btn-primary" disabled={busy} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', borderColor: '#25D366' }}>
        <MessageCircle size={15} /> {busy ? 'OPENING WHATSAPP...' : 'SEND VIA WHATSAPP'}
      </button>
      {status && <p role="status" className={status.ok ? 'status-ok' : 'status-err'}>{status.text}</p>}
    </form>
  );
}
