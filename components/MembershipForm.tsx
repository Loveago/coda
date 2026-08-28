'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import PayDuesButton from '@/components/PayDuesButton';

const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };

type Result = {
  ok: boolean;
  text: string;
  devVerifyUrl?: string;
  pay?: boolean;
  authorizationUrl?: string;
};

export default function MembershipForm({ registrationFeeEnabled, registrationFeeAmount }: { registrationFeeEnabled: boolean; registrationFeeAmount: number }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const redirected = useRef(false);

  // Pay-first flow: as soon as the account is created and the server has
  // produced a Paystack authorization URL, send the applicant straight to the
  // secure checkout. The application only reaches the admin panel after the
  // fee is verified (callback + webhook).
  useEffect(() => {
    if (result?.ok && result.authorizationUrl && !redirected.current) {
      redirected.current = true;
      // Small delay so the "redirecting" state paints before navigation.
      const timer = window.setTimeout(() => { window.location.href = result.authorizationUrl!; }, 400);
      return () => window.clearTimeout(timer);
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
      sessionStorage.setItem('gacoda-applicant-email', String(raw.email));
      setResult({
        ok: true,
        text: data.registrationFeeRequired
          ? data.authorizationUrl
            ? `Account created! Your reference is ${data.memberNumber}. Redirecting you to secure payment now — your application is submitted as soon as the payment is confirmed.`
            : `Account created! Your reference is ${data.memberNumber}. We could not open the payment page just now (${data.paymentStartError || 'payment provider unavailable'}), but your details are saved. Complete the payment below to submit your application.`
          : `Application received! Your reference is ${data.memberNumber}. It has been submitted for review.`,
        devVerifyUrl: data.devVerifyUrl,
        pay: Boolean(data.registrationFeeRequired),
        authorizationUrl: data.authorizationUrl
      });
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : 'Unable to submit your application.' });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    const redirecting = result.pay && result.authorizationUrl;
    return (
      <div className="panel" style={{ maxWidth: 640, textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 12 }}>
        {redirecting ? (
          <>
            <h2 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 10 }}><Loader2 size={22} className="spin" /> Redirecting to secure payment…</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>You will be returned here automatically once your payment is confirmed. Your application is submitted to GACODA the moment payment succeeds.</p>
            <p style={{ fontSize: 12.5, margin: 0 }}>Not redirected? <a href={result.authorizationUrl} style={{ color: 'var(--blue)', fontWeight: 700 }}>Continue to payment →</a></p>
          </>
        ) : (
          <>
            <h2 style={{ margin: 0 }}>{result.pay ? 'Almost there — complete your payment 💳' : 'Application submitted 🎉'}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{result.text}</p>
            {result.devVerifyUrl && <p style={{ fontSize: 12, wordBreak: 'break-all' }}>Email delivery is not configured yet — verify here: <a href={result.devVerifyUrl} style={{ color: 'var(--blue)', fontWeight: 700 }}>Verify my email</a></p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {result.pay
                ? <PayDuesButton type="REGISTRATION_FEE" label="PAY REGISTRATION FEE NOW" />
                : <Link href="/member/dashboard" className="btn btn-primary">GO TO MY PORTAL</Link>}
              <Link href="/membership-status" className="btn btn-ghost">CHECK STATUS LATER</Link>
            </div>
          </>
        )}
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
          A one-time registration fee of <strong>GHS {(registrationFeeAmount / 100).toFixed(2)}</strong> is required.
          After you submit this form you will be taken to Paystack&rsquo;s secure checkout — your application is sent
          for review the moment your payment is confirmed.
        </p>
      )}

      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'SUBMITTING...' : registrationFeeEnabled ? 'SUBMIT & PAY APPLICATION FEE' : 'SUBMIT APPLICATION'}</button>
      {result && !result.ok && <p role="alert" className="status-err" style={{ marginTop: 12 }}>{result.text}</p>}
      <p className="form-note" style={{ marginTop: 14 }}>
        Already applied? <Link href="/membership-status" style={{ color: 'var(--blue)', fontWeight: 700 }}>Check your status →</Link> or <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>log in →</Link>
      </p>
    </form>
  );
}
