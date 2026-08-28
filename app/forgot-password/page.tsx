'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import '../globals.css';

const field = { padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', fontSize: 13 };

export default function ForgotPassword() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/members/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      setDone(true);
      if (result.devResetUrl) setDevLink(result.devResetUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-wrap">
      <form onSubmit={submit} className="login-card">
        <div className="brand">
          <img src="/logo-mark.png" alt="GACODA logo" className="brand-logo" width={51} height={51} />
          <div><div className="brand-name">GACODA</div><small className="brand-sub">MEMBER PORTAL</small></div>
        </div>
        <h1>Reset your password</h1>
        {done ? (
          <>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>If that email is registered, a reset link has been generated. Check your inbox.</p>
            {devLink && <p style={{ fontSize: 12, wordBreak: 'break-all' }}>Email delivery is not configured yet — use this link: <a href={devLink} style={{ color: 'var(--blue)', fontWeight: 700 }}>{devLink}</a></p>}
          </>
        ) : (
          <>
            <p>Enter the email address on your member account.</p>
            <input name="email" type="email" required placeholder="Email address" className="field" aria-label="Email address" />
            <button className="btn btn-primary" disabled={busy}>{busy ? 'SENDING...' : 'SEND RESET LINK'}</button>
          </>
        )}
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}><Link href="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>← Back to sign in</Link></p>
      </form>
    </main>
  );
}
