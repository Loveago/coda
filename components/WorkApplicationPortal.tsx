'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Briefcase, FileText, Loader2, Paperclip, Send, Trash2
} from 'lucide-react';
import { EMPLOYMENT_TYPES } from '@/lib/work-applications';

const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };

type Application = {
  id: string;
  position: string;
  employmentType: string;
  region: string | null;
  status: string;
  paymentState: string;
  createdAt: string;
  cvUrl: string | null;
};

type Opportunity = { id: string; title: string; description: string };

const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

const statusTone: Record<string, string> = {
  NEW: 'badge-PENDING',
  REVIEWING: 'badge-PENDING',
  INTERVIEW: 'badge-active',
  HIRED: 'badge-PUBLISHED',
  REJECTED: 'badge-REJECTED'
};

const employmentLabels: Record<string, string> = Object.fromEntries(
  EMPLOYMENT_TYPES.map((value) => [value, value.replace('_', ' ')])
);

export default function WorkApplicationPortal({
  initialApplications,
  opportunities,
  memberPhone
}: {
  initialApplications: Application[];
  opportunities: Opportunity[];
  memberPhone?: string;
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState('');
  const [cvName, setCvName] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep the list fresh so members see status updates from recruiters without
  // refreshing the page.
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch('/api/member/work-applications');
        if (!response.ok) return;
        const data = await response.json();
        setApplications(data.applications);
      } catch {
        // transient — the next tick retries
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleCv(file: File) {
    if (file.type !== 'application/pdf') {
      setMessage({ ok: false, text: 'CV must be a PDF document.' });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      setCvUrl(result.url);
      setCvName(file.name);
      setMessage({ ok: true, text: 'CV uploaded. Fill in the details and submit your application.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/member/work-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: raw.position,
          employmentType: raw.employmentType || 'FULL_TIME',
          contactPhone: raw.contactPhone || undefined,
          region: raw.region || undefined,
          licenceClass: raw.licenceClass || undefined,
          licenceNumber: raw.licenceNumber || undefined,
          licenceExpiry: raw.licenceExpiry ? new Date(String(raw.licenceExpiry)).toISOString() : undefined,
          experienceYears: raw.experienceYears ? Number(raw.experienceYears) : undefined,
          platforms: raw.platforms || undefined,
          cvUrl: cvUrl || undefined,
          coverNote: raw.coverNote || undefined,
          consent: raw.consent === 'on'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit your application.');
      setApplications((current) => [data.application, ...current]);
      event.currentTarget.reset();
      setCvUrl('');
      setCvName('');
      if (fileRef.current) fileRef.current.value = '';
      setMessage({
        ok: true,
        text: 'Application submitted! Our recruitment team will review it and contact you.'
      });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Unable to submit your application.' });
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(id: string) {
    if (!window.confirm('Withdraw this application?')) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/member/work-applications/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to withdraw the application.');
      }
      setApplications((current) => current.filter((application) => application.id !== id));
      setMessage({ ok: true, text: 'Application withdrawn.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Unable to withdraw the application.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {/* ===== My applications ===== */}
      <section className="admin-panel">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Briefcase size={19} /> My Applications ({applications.length})</h2>
        {applications.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>You have not applied for any role yet — use the form below to get started.</p>
        ) : (
          <div className="pay-timeline">
            {applications.map((application) => (
              <div className="pay-item pay-successful" key={application.id} style={{ cursor: 'default' }}>
                <span className="pay-item-main">
                  <strong>{application.position}</strong>
                  <small>
                    {employmentLabels[application.employmentType] || application.employmentType}
                    {application.region ? ` · ${application.region}` : ''} · Applied {dateFormatter.format(new Date(application.createdAt))}
                  </small>
                  {application.cvUrl && <a href={application.cvUrl} target="_blank" rel="noreferrer" className="admin-link" style={{ fontSize: 11 }}><Paperclip size={11} style={{ verticalAlign: -1 }} /> MY CV</a>}
                </span>
                <span className="pay-item-side" style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                  <span className={`badge ${statusTone[application.status] || 'badge-PENDING'}`}>{application.status}</span>
                  {application.status === 'NEW' && (
                    <button type="button" className="admin-action danger" style={{ fontSize: 10 }} disabled={busy} onClick={() => withdraw(application.id)}>
                      <Trash2 size={11} /> WITHDRAW
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== New application ===== */}
      <section className="admin-panel">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Send size={18} /> Apply for Work</h2>
        {opportunities.length > 0 && (
          <p className="admin-note" style={{ marginBottom: 14 }}>
            We are currently recruiting for: <strong>{opportunities.map((opportunity) => opportunity.title).join(' and ')}</strong>. Pick a track below and tell us about yourself — or apply for any role from the <a href="/jobs" className="admin-link">general job board</a>.
          </p>
        )}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-grid">
            <div>
              <label style={label}>TRACK APPLIED FOR *</label>
              <select name="position" required className="field" defaultValue={opportunities[0]?.title || ''}>
                {opportunities.length === 0 && <option value="">No open tracks right now</option>}
                {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.title}>{opportunity.title}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>EMPLOYMENT TYPE *</label>
              <select name="employmentType" className="field" defaultValue="FULL_TIME">
                {EMPLOYMENT_TYPES.map((value) => <option key={value} value={value}>{employmentLabels[value]}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>CONTACT PHONE (WHATSAPP) *</label>
              <input name="contactPhone" required type="tel" minLength={7} placeholder="e.g. 024 123 4567" defaultValue={memberPhone || ''} className="field" />
            </div>
            <div>
              <label style={label}>REGION</label>
              <input name="region" placeholder="e.g. Greater Accra" className="field" />
            </div>
            <div>
              <label style={label}>YEARS OF EXPERIENCE</label>
              <input name="experienceYears" type="number" min={0} max={60} placeholder="e.g. 5" className="field" />
            </div>
            <div>
              <label style={label}>DRIVING LICENCE CLASS</label>
              <input name="licenceClass" placeholder="e.g. PSV / Truck" className="field" />
            </div>
            <div>
              <label style={label}>LICENCE NUMBER</label>
              <input name="licenceNumber" placeholder="Licence number" className="field" />
            </div>
            <div>
              <label style={label}>LICENCE EXPIRY</label>
              <input name="licenceExpiry" type="date" className="field" />
            </div>
            <div>
              <label style={label}>PLATFORMS DRIVEN FOR</label>
              <input name="platforms" placeholder="e.g. Uber, Bolt, Yango" className="field" />
            </div>
          </div>

          <label
            className="upload-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) handleCv(file);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleCv(file);
              }}
            />
            <span className="upload-hint">
              {uploading ? <Loader2 size={24} className="spin" /> : <FileText size={24} />}
              {uploading ? 'Uploading CV...' : cvUrl ? <>CV ready: <strong>{cvName}</strong><small>Click to replace</small></> : <>Click or drag your CV (PDF) here<small>Optional · PDF only · up to 15 MB</small></>}
            </span>
          </label>

          <div>
            <label style={label}>COVER NOTE</label>
            <textarea name="coverNote" rows={3} placeholder="Tell us why you're the right fit…" className="field" style={{ resize: 'vertical' }} />
          </div>

          <label style={{ fontSize: 12.5, color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <input type="checkbox" name="consent" required style={{ marginTop: 2 }} />
            I confirm the information provided is accurate and consent to Mr Truth Agency processing my application and contacting me about opportunities.
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={busy || uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {busy ? <Loader2 size={15} className="spin" /> : <Send size={15} />} {busy ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Free for members — no application fee.</span>
          </div>
        </form>
        {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ marginTop: 12, fontSize: 12.5 }}>{message.text}</p>}
      </section>
    </div>
  );
}
