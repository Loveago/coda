'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Briefcase, CheckCircle2, Clock3, FileText, Loader2, MapPin, Paperclip,
  Send, Trash2, Upload
} from 'lucide-react';
import PayDuesButton from '@/components/PayDuesButton';
import { formatGhs } from '@/lib/fees';
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
  feeEnabled,
  feeAmount
}: {
  initialApplications: Application[];
  opportunities: Opportunity[];
  feeEnabled: boolean;
  feeAmount: number;
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState('');
  const [cvName, setCvName] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-check the payment state of freshly submitted applications so the "pay
  // fee" button disappears the moment the webhook/callback settles it.
  const hasPendingPayment = applications.some((application) => application.paymentState === 'PENDING');
  useEffect(() => {
    if (!hasPendingPayment) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch('/api/member/work-applications');
        if (!response.ok) return;
        const data = await response.json();
        setApplications(data.applications);
      } catch {
        // transient — the next tick retries
      }
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [hasPendingPayment]);

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
        text: data.feeRequired
          ? `Application saved! Pay the ${formatGhs(data.feeAmount)} application fee below to submit it to our recruiters.`
          : 'Application submitted! Our recruitment team will review it and contact you.'
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
              <div className={`pay-item pay-${application.paymentState === 'PENDING' ? 'pending' : 'successful'}`} key={application.id} style={{ cursor: 'default' }}>
                <span className="pay-item-main">
                  <strong>{application.position}</strong>
                  <small>
                    {employmentLabels[application.employmentType] || application.employmentType}
                    {application.region ? ` · ${application.region}` : ''} · Applied {dateFormatter.format(new Date(application.createdAt))}
                  </small>
                  {application.cvUrl && <a href={application.cvUrl} target="_blank" rel="noreferrer" className="admin-link" style={{ fontSize: 11 }}><Paperclip size={11} style={{ verticalAlign: -1 }} /> MY CV</a>}
                </span>
                <span className="pay-item-side" style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                  {application.paymentState === 'PENDING' ? (
                    <PayDuesButton
                      type="WORK_APPLICATION_FEE"
                      workApplicationId={application.id}
                      label={`PAY ${formatGhs(feeAmount)} TO SUBMIT`}
                      className="btn btn-primary"
                    />
                  ) : (
                    <span className={`badge ${statusTone[application.status] || 'badge-PENDING'}`}>{application.status}</span>
                  )}
                  {application.paymentState === 'PENDING' && (
                    <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock3 size={11} /> Awaiting payment</span>
                  )}
                  {application.paymentState === 'PENDING' && (
                    <button type="button" className="admin-action danger" style={{ fontSize: 10 }} disabled={busy} onClick={() => withdraw(application.id)}>
                      <Trash2 size={11} /> WITHDRAW
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        {feeEnabled && applications.some((a) => a.paymentState === 'PENDING') && (
          <p className="admin-note" style={{ marginTop: 12 }}>
            <CheckCircle2 size={13} style={{ verticalAlign: -2, color: 'var(--accent)' }} /> Applications are only sent to recruiters once the {formatGhs(feeAmount)} application fee is confirmed.
          </p>
        )}
      </section>

      {/* ===== New application ===== */}
      <section className="admin-panel">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Send size={18} /> Apply for Work</h2>
        {opportunities.length > 0 && (
          <p className="admin-note" style={{ marginBottom: 14 }}>
            Currently open: {opportunities.map((opportunity) => opportunity.title).join(' · ')} — or propose any other role you qualify for.
          </p>
        )}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div className="form-grid">
            <div>
              <label style={label}>POSITION APPLIED FOR *</label>
              <input name="position" required minLength={2} list="open-positions" placeholder="e.g. Fleet Driver" className="field" />
              <datalist id="open-positions">
                {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.title} />)}
              </datalist>
            </div>
            <div>
              <label style={label}>EMPLOYMENT TYPE *</label>
              <select name="employmentType" className="field" defaultValue="FULL_TIME">
                {EMPLOYMENT_TYPES.map((value) => <option key={value} value={value}>{employmentLabels[value]}</option>)}
              </select>
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
            {feeEnabled && <span style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={12} /> A {formatGhs(feeAmount)} application fee applies after submission.</span>}
          </div>
        </form>
        {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ marginTop: 12, fontSize: 12.5 }}>{message.text}</p>}
      </section>
    </div>
  );
}
