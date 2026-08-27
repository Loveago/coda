'use client';

import { FormEvent, useEffect, useState } from 'react';

const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 };

type Status = {
  configured: boolean;
  source: 'database' | 'environment' | 'none';
  mode: 'test' | 'live' | 'unknown';
  secretMasked: string | null;
  publicKey: string | null;
  updatedAt: string | null;
};

export default function PaystackSettingsForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const response = await fetch('/api/admin/paystack');
    if (!response.ok) return;
    setStatus(await response.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const secretKey = String(form.get('secretKey') || '').trim();
    const publicKey = String(form.get('publicKey') || '').trim();
    if (!secretKey && !publicKey) {
      setMessage({ ok: false, text: 'Enter at least one key — leave a field blank to keep its current value.' });
      return;
    }
    if (!window.confirm('Save these Paystack keys? New payments will use them immediately.')) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/paystack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(secretKey ? { secretKey } : {}), ...(publicKey ? { publicKey } : {}) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save the keys.');
      (event.target as HTMLFormElement).reset();
      await load();
      setMessage({ ok: true, text: 'Paystack keys saved — they are used for new payments immediately.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Unable to save the keys.' });
    } finally {
      setBusy(false);
    }
  }

  async function clearKeys() {
    if (!window.confirm('Remove the stored keys? Payments will fall back to the .env configuration, or to the simulator if none is set there.')) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/paystack', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear: true })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to remove the keys.');
      await load();
      setMessage({ ok: true, text: 'Stored keys removed.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Unable to remove the keys.' });
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <div className="admin-panel"><p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading Paystack settings…</p></div>;

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="admin-panel" style={{ display: 'grid', gap: 10, maxWidth: 640 }}>
        <h2 style={{ margin: 0 }}>Current status</h2>
        <p style={{ margin: 0, fontSize: 13.5 }}>
          {status.configured ? (
            <>
              Paystack is <strong>{status.mode === 'live' ? 'LIVE' : status.mode === 'test' ? 'TEST' : 'UNKNOWN'}</strong> mode · key <code>{status.secretMasked}</code> · loaded from{' '}
              <strong>{status.source === 'database' ? 'these settings' : 'the .env file'}</strong>.
            </>
          ) : (
            <>No secret key configured — payments currently use the built-in simulator.</>
          )}
        </p>
        {status.publicKey && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Public key on file: <code>{status.publicKey}</code></p>
        )}
        {status.updatedAt && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
            Last updated {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(status.updatedAt))}
          </p>
        )}
      </div>

      <form onSubmit={save} className="admin-panel" style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <h2 style={{ margin: 0 }}>Update keys</h2>
        <div>
          <label style={label} htmlFor="paystack-secret">SECRET KEY</label>
          <input id="paystack-secret" name="secretKey" type="password" autoComplete="off" spellCheck={false} placeholder={status.secretMasked ?? 'sk_test_…'} className="field" style={{ width: '100%' }} />
          <small style={{ color: 'var(--muted)', fontSize: 12 }}>Leave blank to keep the current key. It is stored in the database and never displayed again.</small>
        </div>
        <div>
          <label style={label} htmlFor="paystack-public">PUBLIC KEY (OPTIONAL)</label>
          <input id="paystack-public" name="publicKey" autoComplete="off" spellCheck={false} placeholder={status.publicKey ?? 'pk_test_…'} className="field" style={{ width: '100%' }} />
        </div>
        <button className="btn btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'SAVING...' : 'SAVE KEYS'}</button>
        {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ margin: 0 }}>{message.text}</p>}
      </form>

      {status.source === 'database' && (
        <div className="admin-panel" style={{ maxWidth: 640 }}>
          <button type="button" className="admin-action danger" disabled={busy} onClick={clearKeys}>REMOVE STORED KEYS</button>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>Deletes the keys stored here so the site falls back to the .env configuration.</p>
        </div>
      )}
    </div>
  );
}
