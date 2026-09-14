'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { CreditCard, ExternalLink, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };
const optional = <span className="opt-badge">OPTIONAL</span>;

interface RegistrationFeeProp {
  amount: number; // pesewas
  enabled: boolean;
  currency: string;
}

type Result = {
  ok: boolean;
  text: string;
  memberNumber?: string;
  requiresPayment?: boolean;
  paymentUrl?: string;
  feeAmount?: number;
  devVerifyUrl?: string;
};

export default function MembershipForm({ registrationFee }: { registrationFee?: RegistrationFeeProp }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [registrationCode, setRegistrationCode] = useState('');
  const redirected = useRef(false);

  const feeEnabled = registrationFee ? registrationFee.enabled : false;
  const feeGhs = registrationFee ? (registrationFee.amount / 100).toFixed(2) : '20.00';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code') || params.get('ref') || '';
      if (codeParam) {
        setRegistrationCode(codeParam.trim().toUpperCase());
      }
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = { ...raw, yearsExperience: raw.yearsExperience ? Number(raw.yearsExperience) : undefined };
    try {
      const response = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit your application.');
      sessionStorage.setItem('mrtruth-applicant-email', String(raw.email));

      if (data.requiresPayment && data.paymentUrl) {
        setResult({
          ok: true,
          requiresPayment: true,
          paymentUrl: data.paymentUrl,
          feeAmount: data.feeAmount,
          memberNumber: data.memberNumber,
          text: `Application registered! Member ID: ${data.memberNumber}. A registration fee of GHS ${(data.feeAmount / 100).toFixed(2)} is required to activate your membership.`,
          devVerifyUrl: data.devVerifyUrl
        });
      } else {
        setResult({
          ok: true,
          requiresPayment: false,
          memberNumber: data.memberNumber,
          text: `Application received! Your reference is ${data.memberNumber}. Membership is completely free — your account has been created.`,
          devVerifyUrl: data.devVerifyUrl
        });
      }
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : 'Unable to submit your application.' });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="panel" style={{ maxWidth: 640, textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 14, margin: '0 auto' }}>
        <h2 style={{ margin: 0 }}>
          {result.requiresPayment ? 'Complete Registration Payment 💳' : 'Application submitted 🎉'}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{result.text}</p>

        {result.requiresPayment && result.paymentUrl && (
          <div style={{ width: '100%', padding: '18px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--line)', margin: '6px 0' }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>
              Registration Fee: <span style={{ color: '#059669', fontSize: 16 }}>GHS {result.feeAmount ? (result.feeAmount / 100).toFixed(2) : feeGhs}</span>
            </p>
            <a
              href={result.paymentUrl}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '12px 24px' }}
            >
              <CreditCard size={18} />
              PAY NOW VIA PAYSTACK (MOMO / CARD)
            </a>
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, margin: '8px 0 0' }}>
              Supports MTN Mobile Money, Telecel Cash, AT Money &amp; Visa/Mastercard
            </p>
          </div>
        )}

        {result.devVerifyUrl && (
          <p style={{ fontSize: 12, wordBreak: 'break-all' }}>
            Email delivery is in dev mode — verify here: <a href={result.devVerifyUrl} style={{ color: 'var(--blue)', fontWeight: 700 }}>Verify my email</a>
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
          <Link href="/member/dashboard" className="btn btn-ghost">GO TO MY PORTAL</Link>
          <Link href="/membership-status" className="btn btn-ghost">CHECK STATUS LATER</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Registration Fee Banner if ON */}
      {feeEnabled ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} style={{ color: '#059669' }} />
            <div>
              <strong style={{ fontSize: 13, color: '#065f46' }}>Membership Registration Fee: GHS {feeGhs}</strong>
              <p style={{ fontSize: 11.5, color: '#047857', margin: 0 }}>Payable during or immediately following registration via Mobile Money or Card.</p>
            </div>
          </div>
          <span className="pill good" style={{ fontSize: 11, padding: '3px 10px' }}>GHS {feeGhs}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 20 }}>
          <ShieldCheck size={18} style={{ color: '#16a34a' }} />
          <div>
            <strong style={{ fontSize: 13, color: '#166534' }}>100% Free Registration</strong>
            <p style={{ fontSize: 11.5, color: '#15803d', margin: 0 }}>No registration fees or annual dues required. Free membership activation.</p>
          </div>
        </div>
      )}

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
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Registration Code *</label>
          <input
            name="registrationCode"
            required
            placeholder="e.g. MTA-9X4K2P"
            value={registrationCode}
            onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
            className="field"
            style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
            autoComplete="off"
          />
          <small style={{ color: 'var(--muted)', fontSize: 11.5, marginTop: 5, display: 'block' }}>
            A valid registration / invitation code is required to sign up. If you do not have a code, please contact an agency administrator.
          </small>
        </div>
      </div>

      <p className="admin-note" style={{ marginTop: 18 }}>
        {feeEnabled
          ? `A registration fee of GHS ${feeGhs} is required to activate membership. Payments are processed securely through Paystack via Mobile Money or Card.`
          : 'Membership is completely free — there is no registration fee and no annual dues. Join once and enjoy your benefits for life.'}
      </p>

      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 18 }}>
        {busy ? 'SUBMITTING...' : feeEnabled ? `SUBMIT & PAY GHS ${feeGhs}` : 'SUBMIT FREE APPLICATION'}
      </button>

      {result && !result.ok && <p role="alert" className="status-err" style={{ marginTop: 12 }}>{result.text}</p>}
      <p className="form-note" style={{ marginTop: 14 }}>
        Already applied? <Link href="/membership-status" style={{ color: 'var(--blue)', fontWeight: 700 }}>Check your status →</Link> or <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>log in →</Link>
      </p>
    </form>
  );
}
