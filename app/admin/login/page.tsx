'use client';

import { FormEvent, useState } from 'react';
import '../../globals.css';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) window.location.href = '/admin';
      else setError((await response.json()).error || 'Invalid credentials.');
    } catch {
      setError('Unable to sign in right now.');
    } finally {
      setBusy(false);
    }
  }

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(140deg,#1A1A1A,#4A4A4A)', padding: 20 }}><form onSubmit={submit} style={{ width: 'min(100%,420px)', background: '#fff', borderRadius: 16, padding: 32, display: 'grid', gap: 16, boxShadow: '0 20px 60px #00000055' }}><div className="brand"><img src="/logo-mark.png" alt="Mr Truth Agency logo placeholder" className="brand-logo" width={51} height={51} /><div><div className="brand-name">MR TRUTH</div><small className="brand-sub">AGENCY CONTROL</small></div></div><h1 style={{ fontFamily: 'Barlow Condensed', fontSize: 36, margin: '16px 0 0' }}>Administrator sign in</h1><p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Use your approved Mr Truth Agency control account.</p><input name="email" type="email" required placeholder="Email address" style={field}/><input name="password" type="password" required placeholder="Password" style={field}/><button className="btn btn-primary" disabled={busy}>{busy ? 'SIGNING IN...' : 'SIGN IN'}</button>{error && <p role="alert" style={{ color: '#c62828', fontSize: 12 }}>{error}</p>}</form></main>;
}

const field = { padding: '14px 16px', border: '1px solid #dbe5f4', borderRadius: 8, background: '#fff', fontSize: 13 };
