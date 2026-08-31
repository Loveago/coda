'use client';

import { FormEvent, useEffect, useState } from 'react';

const field = { padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', fontSize: 13 };
const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 };

type Fees = { registrationFeeAmount: number; registrationFeeEnabled: boolean; annualDuesAmount: number; workApplicationFeeAmount: number; workApplicationFeeEnabled: boolean };
type HistoryRow = { id: string; feeKey: string; previousAmount: number | null; newAmount: number; enabled: boolean; changedBy: string; createdAt: string };

export default function FeeSettingsForm() {
  const [fees, setFees] = useState<Fees | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/fees').then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setFees(data.fees);
      setHistory(data.history);
    });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      registrationFeeAmount: Math.round(Number(form.get('registrationFeeAmount')) * 100),
      registrationFeeEnabled: form.get('registrationFeeEnabled') === 'on',
      annualDuesAmount: Math.round(Number(form.get('annualDuesAmount')) * 100),
      workApplicationFeeAmount: Math.round(Number(form.get('workApplicationFeeAmount')) * 100),
      workApplicationFeeEnabled: form.get('workApplicationFeeEnabled') === 'on',
      note: String(form.get('note') || '')
    };
    if (!window.confirm('Changing these fees will affect future transactions but will not change historical payments. Continue?')) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/fees', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save fees.');
      setFees(result.fees);
      const refreshed = await fetch('/api/admin/fees');
      if (refreshed.ok) setHistory((await refreshed.json()).history);
      setMessage({ ok: true, text: 'Fees updated.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Unable to save fees.' });
    } finally {
      setBusy(false);
    }
  }

  if (!fees) return <div className="admin-panel"><p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading fee settings…</p></div>;

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <form onSubmit={save} className="admin-panel" style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <h2 style={{ margin: 0 }}>Membership & service fees</h2>
        <div className="form-grid">
          <div>
            <label style={label}>REGISTRATION FEE (GHS)</label>
            <input name="registrationFeeAmount" type="number" step="0.01" min={0} defaultValue={(fees.registrationFeeAmount / 100).toFixed(2)} required className="field" />
          </div>
          <div>
            <label style={label}>ANNUAL MEMBERSHIP DUES (GHS)</label>
            <input name="annualDuesAmount" type="number" step="0.01" min={0} defaultValue={(fees.annualDuesAmount / 100).toFixed(2)} required className="field" />
          </div>
          <div>
            <label style={label}>WORK APPLICATION FEE (GHS)</label>
            <input name="workApplicationFeeAmount" type="number" step="0.01" min={0} defaultValue={(fees.workApplicationFeeAmount / 100).toFixed(2)} required className="field" />
          </div>
        </div>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 9 }}>
          <input type="checkbox" name="registrationFeeEnabled" defaultChecked={fees.registrationFeeEnabled} />
          Registration fee enabled — new applicants must pay before approval
        </label>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 9 }}>
          <input type="checkbox" name="workApplicationFeeEnabled" defaultChecked={fees.workApplicationFeeEnabled} />
          Work application fee enabled — members pay before their job application reaches recruiters
        </label>
        <div>
          <label style={label}>NOTE (OPTIONAL)</label>
          <input name="note" placeholder="Reason for change" className="field" />
        </div>
        <button className="btn btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'SAVING...' : 'SAVE FEES'}</button>
        {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ margin: 0 }}>{message.text}</p>}
      </form>

      <div className="admin-panel">
        <h2>Fee change history</h2>
        {history.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No changes recorded yet.</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Fee</th><th>Previous</th><th>New</th><th>Enabled</th><th>Changed by</th></tr></thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.createdAt))}</td>
                  <td>{row.feeKey === 'registration_fee' ? 'Registration fee' : row.feeKey === 'work_application_fee' ? 'Work application fee' : 'Annual dues'}</td>
                  <td>{row.previousAmount === null ? '—' : `GHS ${(row.previousAmount / 100).toFixed(2)}`}</td>
                  <td><strong>GHS {(row.newAmount / 100).toFixed(2)}</strong></td>
                  <td>{row.enabled ? 'ON' : 'OFF'}</td>
                  <td>{row.changedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
