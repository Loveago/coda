'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function SimulateActions({ reference }: { reference: string }) {
  const [busy, setBusy] = useState<'success' | 'failed' | null>(null);
  const [outcome, setOutcome] = useState('');

  async function simulate(success: boolean) {
    setBusy(success ? 'success' : 'failed');
    setOutcome('');
    try {
      if (!success) {
        // Mark failed directly through verify with a bogus flow — the server
        // treats non-success as FAILED for real Paystack; for the simulator we
        // simply report failure to the member without mutating the record.
        await new Promise((resolve) => setTimeout(resolve, 600));
        window.location.href = '/member/payments';
        return;
      }
      const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Verification failed.');
      window.location.href = '/member/payments';
    } catch (error) {
      setOutcome(error instanceof Error ? error.message : 'Simulation failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
      <button className="btn btn-primary" disabled={!reference || busy !== null} onClick={() => simulate(true)}>
        <CheckCircle2 size={15} /> SIMULATE SUCCESS
      </button>
      <button className="btn btn-ghost" disabled={!reference || busy !== null} onClick={() => simulate(false)}>
        <XCircle size={15} /> SIMULATE FAILURE
      </button>
      {outcome && <p role="alert" className="status-err" style={{ width: '100%' }}>{outcome}</p>}
    </div>
  );
}
