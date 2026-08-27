'use client';

import { FormEvent, useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      setStatus(result.success ? 'You are subscribed.' : result.error);
      if (result.success) setEmail('');
    } catch {
      setStatus('Unable to subscribe right now.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} aria-label="Newsletter subscription">
      <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" aria-label="Email address" />
      <button className="btn btn-primary" disabled={busy}>{busy ? 'SUBSCRIBING...' : 'SUBSCRIBE'}</button>
      {status && <small role="status">{status}</small>}
    </form>
  );
}
