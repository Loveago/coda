'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import '../globals.css';

const field = { padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', fontSize: 13 };

export default function MemberLogin() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/members/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      window.location.href = '/member/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-wrap">
      <form onSubmit={submit} className="login-card">
        <div className="brand">
          <img src="/logo-mark.png" alt="Mr Truth Agency logo" className="brand-logo" width={51} height={51} />
          <div>
            <div className="brand-name">MR TRUTH</div>
            <small className="brand-sub">MR TRUTH AGENCY · MEMBER PORTAL</small>
          </div>
        </div>
        <h1>Member sign in</h1>
        <p>Welcome back! Log in to manage your membership.</p>
        <input name="email" type="email" required placeholder="Email address" className="field" aria-label="Email address" />
        <input name="password" type="password" required placeholder="Password" className="field" aria-label="Password" />
        <button className="btn btn-primary" disabled={busy}>{busy ? 'SIGNING IN...' : 'SIGN IN'}</button>
        {error && <p role="alert" style={{ color: '#c0392b', fontSize: 12.5, margin: 0 }}>{error}</p>}
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          <Link href="/forgot-password" style={{ color: 'var(--blue)', fontWeight: 700 }}>Forgot password?</Link>
          {' · '}
          <Link href="/membership" style={{ color: 'var(--blue)', fontWeight: 700 }}>Join free</Link>
        </p>
      </form>
    </main>
  );
}
