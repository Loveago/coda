'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

export default function PayDuesButton({ type, label }: { type: 'REGISTRATION_FEE' | 'ANNUAL_DUES'; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to start payment.');
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start payment.');
      setBusy(false);
    }
  }

  return <>
    <button className="btn btn-primary" onClick={pay} disabled={busy}>
      {busy ? <Loader2 size={15} className="spin" /> : <CreditCard size={15} />} {busy ? 'REDIRECTING...' : label}
    </button>
    {error && <p role="alert" className="status-err" style={{ fontSize: 12.5 }}>{error}</p>}
  </>;
}
