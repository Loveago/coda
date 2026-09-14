'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, Settings, ShieldCheck, Sparkles } from 'lucide-react';

export default function AdminWorkPaySettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [durationWeeks, setDurationWeeks] = useState('104');
  const [gracePeriodDays, setGracePeriodDays] = useState('3');
  const [latePenaltyFee, setLatePenaltyFee] = useState('50');
  const [depositPct, setDepositPct] = useState('5');
  const [paystackPolicy, setPaystackPolicy] = useState('AGENCY_ABSORBS');
  const [minExpYears, setMinExpYears] = useState('2');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/work-and-pay/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setDurationWeeks(String(data.settings.defaultDurationWeeks || 104));
        setGracePeriodDays(String(data.settings.defaultGracePeriodDays ?? 3));
        setLatePenaltyFee(String(data.settings.defaultLatePenaltyFee ?? 50));
        setDepositPct(String(data.settings.defaultDepositPct ?? 5));
        setPaystackPolicy(data.settings.paystackFeePolicy || 'AGENCY_ABSORBS');
        setMinExpYears(String(data.settings.minimumCommercialExperienceYears ?? 2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/work-and-pay/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultDurationWeeks: parseInt(durationWeeks),
          defaultGracePeriodDays: parseInt(gracePeriodDays),
          defaultLatePenaltyFee: parseFloat(latePenaltyFee),
          defaultDepositPct: parseFloat(depositPct),
          paystackFeePolicy: paystackPolicy,
          minimumCommercialExperienceYears: parseInt(minExpYears)
        })
      });

      if (!res.ok) throw new Error('Failed to save settings.');

      setMsg({ type: 'ok', text: 'Work & Pay program rules and financial settings saved successfully.' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Error updating settings.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '40px 0' }}>
        <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading program rules...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="panel" style={{ maxWidth: 780, display: 'grid', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Work &amp; Pay Default Rules &amp; Policies</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
          Establish agency defaults for new contracts, late payment rules, and transaction processing fee policies.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: msg.type === 'ok' ? '#ecfdf5' : '#fef2f2',
            color: msg.type === 'ok' ? '#065f46' : '#991b1b',
            border: `1px solid ${msg.type === 'ok' ? '#a7f3d0' : '#fecaca'}`
          }}
        >
          {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
            Default Duration (Weeks) *
          </label>
          <select
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            className="field"
          >
            <option value="78">78 Weeks (~1.5 Years)</option>
            <option value="104">104 Weeks (~2.0 Years) — Recommended</option>
            <option value="156">156 Weeks (~3.0 Years)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
            Default Grace Period (Days) *
          </label>
          <input
            type="number"
            min="0"
            max="14"
            required
            value={gracePeriodDays}
            onChange={(e) => setGracePeriodDays(e.target.value)}
            className="field"
          />
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>
            Days after installment due date before marked overdue
          </small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
            Late Payment Penalty Fee (GHS) *
          </label>
          <input
            type="number"
            min="0"
            step="1"
            required
            value={latePenaltyFee}
            onChange={(e) => setLatePenaltyFee(e.target.value)}
            className="field"
          />
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>
            Configured penalty assessed for delinquent accounts
          </small>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
            Default Security Deposit (% of Target Price) *
          </label>
          <input
            type="number"
            min="1"
            max="30"
            required
            value={depositPct}
            onChange={(e) => setDepositPct(e.target.value)}
            className="field"
          />
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>
            e.g. 5% of GHS 120,000 = GHS 6,000
          </small>
        </div>
      </div>

      {/* Paystack Fee Policy */}
      <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--line)', display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
          Paystack Mobile Money &amp; Card Processing Fee Policy
        </label>
        <select
          value={paystackPolicy}
          onChange={(e) => setPaystackPolicy(e.target.value)}
          className="field"
        >
          <option value="AGENCY_ABSORBS">Agency Absorbs MoMo / Card Transaction Fees</option>
          <option value="DRIVER_PAYS">Driver Pays Fee (Pass-through surcharge at checkout)</option>
        </select>
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Regardless of policy, the vehicle contract ledger only credits the net principal payment toward the vehicle purchase target.
        </p>
      </div>

      <div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
          Minimum Commercial Driving Experience (Years)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={minExpYears}
          onChange={(e) => setMinExpYears(e.target.value)}
          className="field"
        />
        <small style={{ color: 'var(--muted)', fontSize: 11 }}>
          Required during screening wizard validation
        </small>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'SAVING SETTINGS...' : 'SAVE PROGRAM SETTINGS'}
        </button>
      </div>
    </form>
  );
}
