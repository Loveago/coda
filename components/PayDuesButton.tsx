'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

export default function PayDuesButton({ type, label, asTile, sub, workApplicationId, className }: { type: 'REGISTRATION_FEE' | 'ANNUAL_DUES' | 'WORK_APPLICATION_FEE'; label: string; asTile?: boolean; sub?: string; workApplicationId?: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...(workApplicationId ? { workApplicationId } : {}) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to start payment.');
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start payment.');
      setBusy(false);
    }
  }

  if (asTile) {
    return <>
      <button className="mqa" onClick={pay} disabled={busy} type="button" style={{ border: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
        {busy ? <Loader2 size={20} className="spin" /> : <CreditCard size={20} />}
        <span>{busy ? 'Redirecting...' : label}{sub && <small>{sub}</small>}</span>
      </button>
      {error && <p role="alert" className="status-err" style={{ fontSize: 12.5 }}>{error}</p>}
    </>;
  }

  return <>
    <button className={className || 'btn btn-primary'} onClick={pay} disabled={busy}>
      {busy ? <Loader2 size={15} className="spin" /> : <CreditCard size={15} />} {busy ? 'REDIRECTING...' : label}
    </button>
    {error && <p role="alert" className="status-err" style={{ fontSize: 12.5 }}>{error}</p>}
  </>;
}
