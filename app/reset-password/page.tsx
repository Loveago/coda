'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import '../globals.css';

const field = { padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', fontSize: 13 };

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/members/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Reset failed.');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-wrap">
      <form onSubmit={submit} className="login-card">
        <div className="brand">
          <img src="/logo-mark.png" alt="Mr Truth Agency logo" className="brand-logo" width={51} height={51} />
          <div><div className="brand-name">MR TRUTH</div><small className="brand-sub">MR TRUTH AGENCY · MEMBER PORTAL</small></div>
        </div>
        <h1>Choose a new password</h1>
        {done ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Password updated. You can now <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>sign in</Link>.</p>
        ) : !token ? (
          <p style={{ color: '#c0392b', fontSize: 13 }}>This page requires a valid reset link. <Link href="/forgot-password" style={{ color: 'var(--blue)', fontWeight: 700 }}>Request a new one</Link>.</p>
        ) : (
          <>
            <input name="password" type="password" required minLength={8} placeholder="New password (min 8 characters)" className="field" aria-label="New password" />
            <button className="btn btn-primary" disabled={busy}>{busy ? 'SAVING...' : 'UPDATE PASSWORD'}</button>
            {error && <p role="alert" style={{ color: '#c0392b', fontSize: 12.5, margin: 0 }}>{error}</p>}
          </>
        )}
      </form>
    </main>
  );
}

export default function ResetPassword() {
  return <Suspense fallback={<main className="login-wrap" />}><ResetForm /></Suspense>;
}
