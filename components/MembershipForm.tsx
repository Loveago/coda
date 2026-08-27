'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

const field = { padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', fontSize: 13, width: '100%' };
const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };

export default function MembershipForm({ registrationFeeEnabled, registrationFeeAmount }: { registrationFeeEnabled: boolean; registrationFeeAmount: number }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; devVerifyUrl?: string; pay?: boolean } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = { ...raw, yearsExperience: raw.yearsExperience ? Number(raw.yearsExperience) : undefined };
    try {
      const response = await fetch('/api/members/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit your application.');
      sessionStorage.setItem('gacoda-applicant-email', String(raw.email));
      setResult({
        ok: true,
        text: `Application received! Your reference is ${data.memberNumber}. Check your email to verify your account.`,
        devVerifyUrl: data.devVerifyUrl,
        pay: data.registrationFeeRequired
      });
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : 'Unable to submit your application.' });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="panel" style={{ maxWidth: 640, textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Application submitted 🎉</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{result.text}</p>
        {result.devVerifyUrl && <p style={{ fontSize: 12, wordBreak: 'break-all' }}>Email delivery is not configured yet — verify here: <a href={result.devVerifyUrl} style={{ color: 'var(--blue)', fontWeight: 700 }}>Verify my email</a></p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {result.pay && <Link href="/login" className="btn btn-primary">CONTINUE TO REGISTRATION FEE</Link>}
          <Link href="/membership-status" className="btn btn-ghost">CHECK STATUS LATER</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel" style={{ maxWidth: 860 }}>
      <p className="section-label">PERSONAL INFORMATION</p>
      <div className="form-grid">
        <div><label style={label}>First name *</label><input name="firstName" required minLength={2} className="field" /></div>
        <div><label style={label}>Last name *</label><input name="lastName" required minLength={2} className="field" /></div>
        <div><label style={label}>Phone number *</label><input name="phone" required minLength={7} className="field" /></div>
        <div><label style={label}>Date of birth</label><input name="dateOfBirth" type="date" className="field" /></div>
        <div><label style={label}>Gender</label>
          <select name="gender" className="field" defaultValue="">
            <option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div><label style={label}>Residential location</label><input name="location" placeholder="e.g. Madina, Accra" className="field" /></div>
      </div>

      <p className="section-label" style={{ marginTop: 22 }}>DRIVER INFORMATION</p>
      <div className="form-grid">
        <div><label style={label}>Driving platform</label><input name="platform" placeholder="Bolt, Uber, Yango..." className="field" /></div>
        <div><label style={label}>Years of experience</label><input name="yearsExperience" type="number" min={0} max={80} className="field" /></div>
        <div><label style={label}>Vehicle information</label><input name="vehicleInfo" placeholder="e.g. Toyota Corolla 2018" className="field" /></div>
        <div><label style={label}>Vehicle registration number</label><input name="vehicleRegistration" placeholder="e.g. GR-1234-20" className="field" /></div>
      </div>

      <p className="section-label" style={{ marginTop: 22 }}>EMERGENCY CONTACT</p>
      <div className="form-grid">
        <div><label style={label}>Name</label><input name="emergencyName" className="field" /></div>
        <div><label style={label}>Phone</label><input name="emergencyPhone" className="field" /></div>
        <div><label style={label}>Relationship</label><input name="emergencyRelationship" placeholder="e.g. Spouse, Sibling" className="field" /></div>
      </div>

      <p className="section-label" style={{ marginTop: 22 }}>YOUR ACCOUNT</p>
      <div className="form-grid">
        <div><label style={label}>Email address *</label><input name="email" type="email" required className="field" /></div>
        <div><label style={label}>Password * (min 8 characters)</label><input name="password" type="password" required minLength={8} className="field" /></div>
      </div>

      {registrationFeeEnabled && (
        <p className="admin-note" style={{ marginTop: 18 }}>
          A one-time registration fee of <strong>GHS {(registrationFeeAmount / 100).toFixed(2)}</strong> applies after submitting this application.
        </p>
      )}

      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}</button>
      {result && !result.ok && <p role="alert" className="status-err" style={{ marginTop: 12 }}>{result.text}</p>}
      <p className="form-note" style={{ marginTop: 14 }}>
        Already applied? <Link href="/membership-status" style={{ color: 'var(--blue)', fontWeight: 700 }}>Check your status →</Link> or <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>log in →</Link>
      </p>
    </form>
  );
}
