'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, Loader2, Search, User } from 'lucide-react';

interface AppResult {
  applicationNumber: string;
  fullName: string;
  preferredVehicleType: string;
  operatingRegion: string;
  status: string;
  interviewDate: string | null;
  interviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusOrder = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'INTERVIEW_SCHEDULED',
  'APPROVED',
  'AGREEMENT_PENDING',
  'ACTIVE'
];

export default function WorkPayTracker({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<AppResult | null>(null);

  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, [initialQuery]);

  async function search(qToUse?: string) {
    const q = (qToUse || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setApp(null);

    try {
      const res = await fetch(`/api/work-and-pay/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No record found.');

      setApp(data.application);
    } catch (err: any) {
      setError(err.message || 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    search();
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 24 }}>
      <form onSubmit={handleSearch} className="panel" style={{ display: 'flex', gap: 10, padding: 16 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter reference code (e.g. MTA-WPA-2026-...), phone number, or Ghana Card"
          className="field"
          style={{ flex: 1, fontSize: 13 }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          TRACK STATUS
        </button>
      </form>

      {error && (
        <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {app && (
        <div className="panel" style={{ padding: 24, display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>
                WORK &amp; PAY APPLICATION
              </span>
              <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800 }}>{app.applicationNumber}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                Applicant: <strong>{app.fullName}</strong>
              </p>
            </div>
            <span className="pill good" style={{ fontSize: 12, padding: '4px 12px' }}>
              {app.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, background: '#f8fafc', padding: 16, borderRadius: 8, fontSize: 12.5 }}>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block' }}>Vehicle Preference</span>
              <strong>{app.preferredVehicleType}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block' }}>Operating Region</span>
              <strong>{app.operatingRegion}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block' }}>Submitted Date</span>
              <strong>{new Date(app.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</strong>
            </div>
          </div>

          {/* Timeline Status */}
          <div>
            <strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Application Progress</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
              {statusOrder.map((st, i) => {
                const currentIdx = statusOrder.indexOf(app.status);
                const isPassed = currentIdx >= i;
                const isCurrent = app.status === st;

                return (
                  <div key={st} style={{ textAlign: 'center', padding: '10px 6px', background: isPassed ? '#ecfdf5' : '#f8fafc', border: `1px solid ${isPassed ? '#a7f3d0' : 'var(--line)'}`, borderRadius: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isPassed ? '#059669' : 'var(--muted)', display: 'block' }}>
                      {st.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {app.interviewDate && (
            <div style={{ padding: 14, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: 12.5, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={18} />
              <div>
                <strong>Interview Scheduled:</strong>{' '}
                {new Date(app.interviewDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                {app.interviewNotes && <p style={{ margin: '4px 0 0' }}>{app.interviewNotes}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
