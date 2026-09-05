'use client';

import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';

type Result = {
  found: boolean;
  status?: string;
  name?: string;
  submittedAt?: string;
  error?: string;
};

const statusCopy: Record<string, string> = {
  PENDING: 'Your application is under review. Our membership team will contact you soon.',
  APPROVED: 'Congratulations! Your application has been approved. Welcome to Mr Truth Agency — membership is free for life!',
  REJECTED: 'Unfortunately your application was not approved at this time. Please contact the Mr Truth Agency team for details.',
  SUSPENDED: 'Your membership is currently suspended. Please contact the Mr Truth team for more information.'
};

export default function MembershipStatusForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch('/api/membership-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: new FormData(event.currentTarget).get('query') })
      });
      const data = await response.json();
      if (!response.ok) setResult({ found: false, error: data.error || 'Lookup failed.' });
      else setResult(data);
    } catch {
      setResult({ found: false, error: 'Unable to check your status right now.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <form onSubmit={submit} className="panel" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          name="query"
          required
          minLength={3}
          placeholder="Phone number or email used during application"
          className="field"
          style={{ flex: '1 1 260px' }}
          aria-label="Phone number or email"
        />
        <button className="btn btn-primary" disabled={busy}>
          <Search size={15} /> {busy ? 'CHECKING...' : 'CHECK STATUS'}
        </button>
      </form>
      {result && !result.found && (
        <div className="panel" style={{ marginTop: 18 }} role="status">
          <h2>{result.error ? 'Something went wrong' : 'No application found'}</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {result.error || 'We could not find an application matching that phone number or email. Double-check and try again, or submit a new application.'}
          </p>
        </div>
      )}
      {result?.found && result.status && (
        <div style={{ marginTop: 18, animation: 'riseIn .5s cubic-bezier(.22,.61,.36,1) both' }} role="status">
          <div className={`status-card status-${result.status}`}>
            <span style={{ fontSize: 11, letterSpacing: 1.6, opacity: .85 }}>APPLICATION STATUS</span>
            <strong>{result.status}</strong>
            <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.55, maxWidth: 480 }}>{statusCopy[result.status]}</p>
            <small style={{ display: 'block', marginTop: 12, opacity: .8, fontSize: 11 }}>
              Applicant: {result.name} · Submitted {result.submittedAt ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(result.submittedAt)) : ''}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
