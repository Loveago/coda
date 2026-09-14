'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, History, Loader2, Save, ShieldCheck, Sparkles } from 'lucide-react';

interface FeeItem {
  key: string;
  amount: number; // pesewas
  enabled: boolean;
  currency: string;
  gracePeriodDays: number;
}

interface FeeHistory {
  id: string;
  feeKey: string;
  previousAmount: number | null;
  newAmount: number;
  enabled: boolean;
  currency: string;
  gracePeriodDays: number;
  changedBy: string;
  note: string | null;
  createdAt: string;
}

export default function MembershipFeeSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Registration Fee Form State
  const [regEnabled, setRegEnabled] = useState(true);
  const [regAmountGhs, setRegAmountGhs] = useState('20');
  const [regGraceDays, setRegGraceDays] = useState('0');

  // Annual Dues Form State
  const [duesEnabled, setDuesEnabled] = useState(true);
  const [duesAmountGhs, setDuesAmountGhs] = useState('200');
  const [duesGraceDays, setDuesGraceDays] = useState('30');

  const [note, setNote] = useState('');
  const [history, setHistory] = useState<FeeHistory[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/membership');
      const data = await res.json();
      if (res.ok && data.settings) {
        setRegEnabled(data.settings.registration.enabled);
        setRegAmountGhs(String(data.settings.registration.amount / 100));
        setRegGraceDays(String(data.settings.registration.gracePeriodDays ?? 0));

        setDuesEnabled(data.settings.annualDues.enabled);
        setDuesAmountGhs(String(data.settings.annualDues.amount / 100));
        setDuesGraceDays(String(data.settings.annualDues.gracePeriodDays ?? 30));

        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load fee settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationFeeEnabled: regEnabled,
          registrationFeeAmount: parseFloat(regAmountGhs) || 0,
          registrationGracePeriod: parseInt(regGraceDays) || 0,
          annualDuesEnabled: duesEnabled,
          annualDuesAmount: parseFloat(duesAmountGhs) || 0,
          annualDuesGracePeriod: parseInt(duesGraceDays) || 30,
          note: note.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save fee settings.');

      setMessage({ type: 'success', text: 'Membership fee configuration updated successfully.' });
      setNote('');
      if (data.history) setHistory(data.history);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating settings.' });
    } finally {
      setSaving(false);
    }
  }

  const formatMoney = (pesewas: number) => `GHS ${(pesewas / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px', color: 'var(--blue)' }} />
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading membership fee configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 1050 }}>
      {/* Overview KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="panel" style={{ borderLeft: `4px solid ${regEnabled ? '#10b981' : '#9ca3af'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px' }}>REGISTRATION FEE</span>
            <span className={`pill ${regEnabled ? 'good' : 'muted'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
              {regEnabled ? 'ENABLED (PAID)' : 'DISABLED (FREE)'}
            </span>
          </div>
          <h2 style={{ fontSize: 28, margin: '8px 0 4px', fontWeight: 800 }}>
            {regEnabled ? `GHS ${parseFloat(regAmountGhs || '0').toFixed(2)}` : 'FREE'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Grace period: {regGraceDays} days · Due immediately on signup
          </p>
        </div>

        <div className="panel" style={{ borderLeft: `4px solid ${duesEnabled ? '#2563eb' : '#9ca3af'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px' }}>ANNUAL MEMBERSHIP DUES</span>
            <span className={`pill ${duesEnabled ? 'tone-blue' : 'muted'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
              {duesEnabled ? 'ENABLED (ACTIVE)' : 'DISABLED (WAIVED)'}
            </span>
          </div>
          <h2 style={{ fontSize: 28, margin: '8px 0 4px', fontWeight: 800 }}>
            {duesEnabled ? `GHS ${parseFloat(duesAmountGhs || '0').toFixed(2)} / yr` : 'WAIVED'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Grace period: {duesGraceDays} days · 365-day annual cycle
          </p>
        </div>
      </div>

      {message && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="panel" style={{ display: 'grid', gap: 24 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Configure Membership Fee Rules</h3>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: 0 }}>
            Fees are never hardcoded. Changes apply immediately to new registrations and future dues renewals.
          </p>
        </div>

        {/* --- PART 1: REGISTRATION FEE --- */}
        <div style={{ padding: 18, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <strong style={{ fontSize: 14 }}>1. Membership Registration Fee</strong>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                Paid by applicants during or immediately following signup to activate account.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={regEnabled}
                onChange={(e) => setRegEnabled(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span>Registration Fee Enabled</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                Amount (GHS) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={!regEnabled}
                value={regAmountGhs}
                onChange={(e) => setRegAmountGhs(e.target.value)}
                required={regEnabled}
                className="field"
                placeholder="20.00"
              />
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                Default: GHS 20.00 (in pesewas: {Math.round((parseFloat(regAmountGhs) || 0) * 100)})
              </small>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                disabled={!regEnabled}
                value={regGraceDays}
                onChange={(e) => setRegGraceDays(e.target.value)}
                className="field"
                placeholder="0"
              />
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                Default: 0 days (due at registration)
              </small>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                Payment Method
              </label>
              <input
                type="text"
                disabled
                value="Paystack (Card, Mobile Money)"
                className="field"
                style={{ background: '#f1f5f9', color: '#64748b' }}
              />
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                MTN MoMo, Telecel Cash, AT Money, Debit/Credit Card
              </small>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: regEnabled ? '#047857' : '#4b5563', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} />
            <span>
              {regEnabled
                ? 'Behavior: User must pay the registration fee to activate membership during or immediately following signup.'
                : 'Behavior: Registration is 100% FREE. No payment screen or fee required. Free members can activate immediately.'}
            </span>
          </div>
        </div>

        {/* --- PART 2: ANNUAL MEMBERSHIP DUES --- */}
        <div style={{ padding: 18, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <strong style={{ fontSize: 14 }}>2. Annual Membership Dues</strong>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                Recurring fee paid annually to keep member in good standing and maintain privileges.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={duesEnabled}
                onChange={(e) => setDuesEnabled(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span>Annual Dues Enabled</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                Annual Dues Amount (GHS) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={!duesEnabled}
                value={duesAmountGhs}
                onChange={(e) => setDuesAmountGhs(e.target.value)}
                required={duesEnabled}
                className="field"
                placeholder="200.00"
              />
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                Default: GHS 200.00 / year
              </small>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                disabled={!duesEnabled}
                value={duesGraceDays}
                onChange={(e) => setDuesGraceDays(e.target.value)}
                className="field"
                placeholder="30"
              />
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                Default: 30 days before marked overdue
              </small>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                Billing Cycle
              </label>
              <input
                type="text"
                disabled
                value="Annual (365 Days)"
                className="field"
                style={{ background: '#f1f5f9', color: '#64748b' }}
              />
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                Calculated from member activation or last renewal
              </small>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: duesEnabled ? '#1d4ed8' : '#4b5563', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} />
            <span>
              {duesEnabled
                ? 'Behavior: Existing members must pay annual dues to maintain active status and access benefits.'
                : 'Behavior: Annual dues are waived for all members. All members remain in good standing.'}
            </span>
          </div>
        </div>

        {/* --- REASON / AUDIT NOTE --- */}
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
            Audit Log Reason / Notes (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Executive board approved 2026 fee structure"
            className="field"
          />
          <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
            This note will be recorded in the immutable FeeSettingHistory table alongside your administrator identity.
          </small>
        </div>

        {/* --- IMMUTABILITY NOTICE --- */}
        <div style={{ display: 'flex', gap: 12, padding: 14, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 12.5, color: '#166534' }}>
          <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Financial Integrity &amp; Immutability Guarantee</strong>
            <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
              Modifying fee amounts or toggling fees <strong>NEVER</strong> alters past payment transactions, historical receipts, or previously recorded financial statements. All historical payments remain permanent and immutable.
            </p>
          </div>
        </div>

        <div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'SAVING SETTINGS...' : 'SAVE FEE CONFIGURATION'}
          </button>
        </div>
      </form>

      {/* Versioned Fee History Table */}
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <History size={18} style={{ color: 'var(--blue)' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 15 }}>Fee Setting History &amp; Audit Trail</h3>
            <p style={{ color: 'var(--muted)', fontSize: 12, margin: '2px 0 0' }}>
              Chronological log of all administrative modifications to registration fees and annual dues.
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No fee changes have been recorded yet. The system is operating on initial defaults.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th>DATE &amp; TIME</th>
                  <th>FEE TYPE</th>
                  <th>ADMIN</th>
                  <th>PREVIOUS</th>
                  <th>NEW AMOUNT</th>
                  <th>STATUS</th>
                  <th>GRACE PERIOD</th>
                  <th>NOTE</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td>
                      <strong style={{ fontSize: 12 }}>
                        {item.feeKey === 'REGISTRATION_FEE' ? 'Registration Fee' : 'Annual Dues'}
                      </strong>
                    </td>
                    <td>{item.changedBy}</td>
                    <td style={{ color: 'var(--muted)' }}>
                      {item.previousAmount !== null ? formatMoney(item.previousAmount) : '—'}
                    </td>
                    <td>
                      <strong>{formatMoney(item.newAmount)}</strong>
                    </td>
                    <td>
                      <span className={`pill ${item.enabled ? 'good' : 'muted'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                        {item.enabled ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>{item.gracePeriodDays ?? 0} days</td>
                    <td style={{ color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
