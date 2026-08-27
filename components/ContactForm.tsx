'use client';

import { FormEvent, useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(form.entries()), website: '' })
      });
      const result = await response.json();
      setStatus({ ok: !!result.success, text: result.success ? 'Your message has been sent. We will respond shortly.' : result.error || 'Unable to send your message.' });
      if (result.success) event.currentTarget.reset();
    } catch {
      setStatus({ ok: false, text: 'Unable to send your message right now.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel" style={{ display: 'grid', gap: 14 }}>
      <div className="form-grid">
        <input name="name" required placeholder="Your name" className="field" aria-label="Your name" />
        <input name="email" required type="email" placeholder="Email address" className="field" aria-label="Email address" />
        <input name="subject" required placeholder="Subject" className="field" aria-label="Subject" />
        <input name="phone" placeholder="Phone number (optional)" className="field" aria-label="Phone number" />
      </div>
      <textarea name="message" required rows={6} placeholder="Your message" className="field" aria-label="Your message" />
      <input type="text" name="website" value="" hidden readOnly aria-hidden="true" tabIndex={-1} />
      <button className="btn btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'SENDING...' : 'SEND MESSAGE'}</button>
      {status && <p role="status" className={status.ok ? 'status-ok' : 'status-err'}>{status.text}</p>}
    </form>
  );
}
