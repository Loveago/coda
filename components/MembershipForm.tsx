'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };
const optional = <span className="opt-badge">OPTIONAL</span>;

type Result = {
  ok: boolean;
  text: string;
  devVerifyUrl?: string;
};

export default function MembershipForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const redirected = useRef(false);

  // Once the account is created we land the applicant on the confirmation.
  useEffect(() => {
    if (result?.ok && !redirected.current) {
      redirected.current = true;
    }
  }, [result]);

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
      sessionStorage.setItem('mrtruth-applicant-email', String(raw.email));
      setResult({
        ok: true,
        text: `Application received! Your reference is ${data.memberNumber}. Membership is completely free — your application has been submitted for review.`,
        devVerifyUrl: data.devVerifyUrl
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
          <Link href="/member/dashboard" className="btn btn-primary">GO TO MY PORTAL</Link>
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
        <div>
          <label style={label}>Ghana Card number *</label>
          <input
            name="ghanaCardNumber"
            required
            placeholder="GHC-123456789-0"
            pattern="GHC-?\d{9}-?\d"
            title="Enter your Ghana Card (national ID) number, e.g. GHC-123456789-0"
            maxLength={15}
            className="field"
            style={{ textTransform: 'uppercase' }}
            autoComplete="off"
          />
        </div>
        <div><label style={label}>Date of birth *</label><input name="dateOfBirth" type="date" required className="field" /></div>
        <div><label style={label}>Gender *</label>
          <select name="gender" className="field" required defaultValue="">
            <option value="" disabled>Select gender</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div><label style={label}>Residential location *</label><input name="location" placeholder="e.g. Madina, Accra" required minLength={2} className="field" /></div>
      </div>

      <p className="section-label" style={{ marginTop: 22 }}>DRIVER INFORMATION</p>
      <div className="form-grid">
        <div><label style={label}>Driving platform{optional}</label><input name="platform" placeholder="Bolt, Uber, Yango..." className="field" /></div>
        <div><label style={label}>Years of experience{optional}</label><input name="yearsExperience" type="number" min={0} max={80} className="field" /></div>
        <div><label style={label}>Vehicle information{optional}</label><input name="vehicleInfo" placeholder="e.g. Toyota Corolla 2018" className="field" /></div>
        <div><label style={label}>Vehicle registration number{optional}</label><input name="vehicleRegistration" placeholder="e.g. GR-1234-20" className="field" /></div>
      </div>

      <p className="section-label" style={{ marginTop: 22 }}>EMERGENCY CONTACTS</p>
      <p className="subsection-label">Contact 1</p>
      <div className="form-grid">
        <div><label style={label}>Name *</label><input name="emergencyName" required minLength={2} className="field" /></div>
        <div><label style={label}>Phone *</label><input name="emergencyPhone" required minLength={7} className="field" /></div>
        <div><label style={label}>Relationship *</label><input name="emergencyRelationship" placeholder="e.g. Spouse, Sibling" required minLength={2} className="field" /></div>
      </div>
      <p className="subsection-label" style={{ marginTop: 16 }}>Contact 2</p>
      <div className="form-grid">
        <div><label style={label}>Name *</label><input name="emergency2Name" required minLength={2} className="field" /></div>
        <div><label style={label}>Phone *</label><input name="emergency2Phone" required minLength={7} className="field" /></div>
        <div><label style={label}>Relationship *</label><input name="emergency2Relationship" placeholder="e.g. Spouse, Sibling" required minLength={2} className="field" /></div>
      </div>

      <p className="section-label" style={{ marginTop: 22 }}>YOUR ACCOUNT</p>
      <div className="form-grid">
        <div><label style={label}>Email address *</label><input name="email" type="email" required className="field" /></div>
        <div><label style={label}>Password * (min 8 characters)</label><input name="password" type="password" required minLength={8} className="field" /></div>
      </div>

      <p className="admin-note" style={{ marginTop: 18 }}>
        Membership is <strong>completely free</strong> — there is no registration fee and no annual dues. Join once and enjoy
        your benefits for life.
      </p>

      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'SUBMITTING...' : 'SUBMIT FREE APPLICATION'}</button>
      {result && !result.ok && <p role="alert" className="status-err" style={{ marginTop: 12 }}>{result.text}</p>}
      <p className="form-note" style={{ marginTop: 14 }}>
        Already applied? <Link href="/membership-status" style={{ color: 'var(--blue)', fontWeight: 700 }}>Check your status →</Link> or <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>log in →</Link>
      </p>
    </form>
  );
}
