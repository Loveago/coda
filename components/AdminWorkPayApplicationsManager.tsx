'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Star,
  User,
  X
} from 'lucide-react';

interface Application {
  id: string;
  applicationNumber: string;
  fullName: string;
  phone: string;
  email: string;
  ghanaCardNumber: string;
  driverLicenseNumber: string;
  driverLicenseClass: string;
  yearsExperience: number;
  commercialHistory: string | null;
  rideHailingPlatforms: string | null;
  preferredVehicleType: string;
  operatingRegion: string;
  guarantor1Name: string;
  guarantor1Phone: string;
  guarantor1Occupation: string;
  guarantor1Address: string;
  guarantor1GhanaCard: string;
  guarantor2Name: string;
  guarantor2Phone: string;
  guarantor2Occupation: string;
  guarantor2Address: string;
  guarantor2GhanaCard: string;
  driverLicenseFrontUrl: string | null;
  driverLicenseBackUrl: string | null;
  ghanaCardFrontUrl: string | null;
  proofOfResidenceUrl: string | null;
  status: string;
  interviewDate: string | null;
  interviewNotes: string | null;
  interviewScore: number | null;
  rejectionReason: string | null;
  internalNotes: string | null;
  createdAt: string;
}

const statuses = [
  'ALL',
  'SUBMITTED',
  'UNDER_REVIEW',
  'INTERVIEW_SCHEDULED',
  'APPROVED',
  'WAITLISTED',
  'REJECTED'
];

export default function AdminWorkPayApplicationsManager() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);

  // Review Drawer state
  const [score, setScore] = useState<number | ''>('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/work-and-pay/applications?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok && data.applications) setApps(data.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openDrawer(app: Application) {
    setSelectedApp(app);
    setScore(app.interviewScore ?? '');
    setInterviewDate(app.interviewDate ? app.interviewDate.split('T')[0] : '');
    setInterviewNotes(app.interviewNotes || '');
    setInternalNotes(app.internalNotes || '');
  }

  async function updateStatus(newStatus: string) {
    if (!selectedApp) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/work-and-pay/applications/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          interviewScore: score !== '' ? Number(score) : undefined,
          interviewDate: interviewDate || undefined,
          interviewNotes: interviewNotes || undefined,
          internalNotes: internalNotes || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedApp(data.application);
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const filtered = apps.filter((a) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(term) ||
      a.phone.includes(term) ||
      a.applicationNumber.toLowerCase().includes(term) ||
      a.ghanaCardNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Search & Filter Header */}
      <div className="panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className="btn btn-ghost"
              style={{
                fontSize: 11.5,
                padding: '6px 12px',
                background: statusFilter === st ? 'var(--blue)' : 'transparent',
                color: statusFilter === st ? '#fff' : 'inherit',
                borderColor: statusFilter === st ? 'var(--blue)' : 'var(--line)'
              }}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, code..."
            className="field"
            style={{ width: 240, padding: '6px 10px', fontSize: 12.5 }}
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No driver applications found for this filter.
          </p>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>CODE</th>
                <th>APPLICANT</th>
                <th>PHONE / EMAIL</th>
                <th>GHANA CARD</th>
                <th>LICENSE</th>
                <th>VEHICLE PREFERENCE</th>
                <th>REGION</th>
                <th>SCORE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <code style={{ fontSize: 11 }}>{a.applicationNumber}</code>
                  </td>
                  <td>
                    <strong>{a.fullName}</strong>
                  </td>
                  <td>
                    <div>{a.phone}</div>
                    <small style={{ color: 'var(--muted)' }}>{a.email}</small>
                  </td>
                  <td>{a.ghanaCardNumber}</td>
                  <td>
                    {a.driverLicenseNumber} <small style={{ color: 'var(--muted)' }}>({a.driverLicenseClass})</small>
                  </td>
                  <td>{a.preferredVehicleType}</td>
                  <td>{a.operatingRegion}</td>
                  <td>
                    {a.interviewScore ? (
                      <strong style={{ color: '#059669' }}>{a.interviewScore}/100</strong>
                    ) : '—'}
                  </td>
                  <td>
                    <span
                      className={`pill ${
                        a.status === 'APPROVED' ? 'good' :
                        a.status === 'REJECTED' ? 'bad' :
                        a.status === 'INTERVIEW_SCHEDULED' ? 'tone-blue' :
                        a.status === 'UNDER_REVIEW' ? 'tone-warn' : 'muted'
                      }`}
                      style={{ fontSize: 10, padding: '2px 8px' }}
                    >
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => openDrawer(a)}
                      className="btn btn-ghost"
                      style={{ fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Full Review Drawer / Modal */}
      {selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              background: '#fff',
              height: '100%',
              overflowY: 'auto',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
                  APPLICATION REVIEW · {selectedApp.applicationNumber}
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800 }}>{selectedApp.fullName}</h2>
              </div>
              <button type="button" onClick={() => setSelectedApp(null)} className="btn btn-ghost" style={{ padding: 6 }}>
                <X size={20} />
              </button>
            </div>

            {/* Status & Fast Actions Strip */}
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <small style={{ color: 'var(--muted)', display: 'block' }}>Current Status</small>
                <strong>{selectedApp.status.replace(/_/g, ' ')}</strong>
              </div>
              {selectedApp.status === 'APPROVED' && (
                <Link
                  href={`/admin/work-and-pay/agreements?create=true&applicantId=${selectedApp.id}`}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FileText size={14} /> CREATE CONTRACT →
                </Link>
              )}
            </div>

            {/* Applicant Profile Information */}
            <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
              <h4 style={{ margin: 0, fontSize: 14, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>1. Driver Credentials</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><span style={{ color: 'var(--muted)' }}>Ghana Card:</span> <strong>{selectedApp.ghanaCardNumber}</strong></div>
                <div><span style={{ color: 'var(--muted)' }}>Phone:</span> <strong>{selectedApp.phone}</strong></div>
                <div><span style={{ color: 'var(--muted)' }}>Email:</span> {selectedApp.email}</div>
                <div><span style={{ color: 'var(--muted)' }}>License:</span> {selectedApp.driverLicenseNumber} ({selectedApp.driverLicenseClass})</div>
                <div><span style={{ color: 'var(--muted)' }}>Experience:</span> {selectedApp.yearsExperience} Years</div>
                <div><span style={{ color: 'var(--muted)' }}>Region:</span> {selectedApp.operatingRegion}</div>
              </div>
              <div><span style={{ color: 'var(--muted)' }}>Commercial Driving History:</span> {selectedApp.commercialHistory || 'None provided'}</div>
              {selectedApp.rideHailingPlatforms && (
                <div><span style={{ color: 'var(--muted)' }}>Platforms &amp; Rating:</span> {selectedApp.rideHailingPlatforms}</div>
              )}
            </div>

            {/* Guarantors */}
            <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
              <h4 style={{ margin: 0, fontSize: 14, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>2. Guarantor Information</h4>
              <div style={{ padding: 10, background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                <strong>Guarantor 1: {selectedApp.guarantor1Name}</strong> ({selectedApp.guarantor1Occupation})
                <div>Phone: {selectedApp.guarantor1Phone} · Ghana Card: {selectedApp.guarantor1GhanaCard}</div>
                <div>Address: {selectedApp.guarantor1Address}</div>
              </div>
              <div style={{ padding: 10, background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                <strong>Guarantor 2: {selectedApp.guarantor2Name}</strong> ({selectedApp.guarantor2Occupation})
                <div>Phone: {selectedApp.guarantor2Phone} · Ghana Card: {selectedApp.guarantor2GhanaCard}</div>
                <div>Address: {selectedApp.guarantor2Address}</div>
              </div>
            </div>

            {/* Interview Assessment & Scoring Form */}
            <div style={{ display: 'grid', gap: 14, padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <h4 style={{ margin: 0, fontSize: 14, color: '#1e40af' }}>3. Interview Vetting &amp; Scoring</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: 4 }}>
                    Interview Score (1 - 100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 85"
                    className="field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: 4 }}>
                    Scheduled Interview Date
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: 4 }}>
                  Interview Assessment Notes
                </label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Notes from mechanical interview and driving evaluation..."
                  className="field"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: 4 }}>
                  Internal Admin Notes
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Internal comments visible only to administrators..."
                  className="field"
                />
              </div>
            </div>

            {/* Status Update Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => updateStatus('UNDER_REVIEW')}
                  disabled={saving}
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                >
                  MARK UNDER REVIEW
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus('INTERVIEW_SCHEDULED')}
                  disabled={saving}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, borderColor: 'var(--blue)', color: 'var(--blue)' }}
                >
                  SCHEDULE INTERVIEW
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => updateStatus('APPROVED')}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', fontSize: 13 }}
                >
                  ✓ APPROVE DRIVER
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus('WAITLISTED')}
                  disabled={saving}
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                >
                  WAITLIST
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus('REJECTED')}
                  disabled={saving}
                  className="btn btn-ghost"
                  style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: 12 }}
                >
                  REJECT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
