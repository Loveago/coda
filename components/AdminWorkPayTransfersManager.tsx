'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Loader2,
  Printer,
  ShieldCheck,
  X
} from 'lucide-react';

interface TransferRecord {
  id: string;
  transferCertificateNumber: string;
  finalPayoffVerified: boolean;
  payoffVerifiedAt: string | null;
  payoffVerifiedBy: string | null;
  transferClearance: boolean;
  dvlaPaperworkStatus: string;
  dvlaSubmissionDate: string | null;
  dvlaCompletionDate: string | null;
  handoverDate: string | null;
  newRegistrationNumber: string | null;
  notes: string | null;
  agreement: {
    id: string;
    agreementNumber: string;
    driverName: string;
    driverPhone: string;
    totalPrice: number;
    totalPaid: number;
    vehicle?: { make: string; model: string; year: number } | null;
  };
}

export default function AdminWorkPayTransfersManager() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [pendingAgreements, setPendingAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [status, setStatus] = useState('DVLA_PROCESSING');
  const [regNum, setRegNum] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  async function fetchTransfers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/work-and-pay/transfers');
      const data = await res.json();
      if (res.ok) {
        if (data.transfers) setTransfers(data.transfers);
        if (data.pendingAgreements) setPendingAgreements(data.pendingAgreements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!selectedTransfer) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/work-and-pay/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: selectedTransfer.agreement.id,
          dvlaPaperworkStatus: status,
          newRegistrationNumber: regNum.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      if (!res.ok) throw new Error('Update failed.');

      setSelectedTransfer(null);
      fetchTransfers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Top Banner */}
      <div className="panel" style={{ padding: 20, borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>DVLA Vehicle Ownership Transfer Registry</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
            Official title transfers for drivers who have completed 100% of target contract remittances.
          </p>
        </div>
        <span className="pill good" style={{ fontSize: 12, padding: '4px 12px' }}>
          {transfers.length} Transfers in Pipeline
        </span>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading transfer registry...</p>
          </div>
        ) : transfers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No completed contracts currently in the title transfer stage.
          </p>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>CERTIFICATE #</th>
                <th>DRIVER / CONTRACT</th>
                <th>VEHICLE</th>
                <th>PAYOFF VERIFIED</th>
                <th>DVLA PAPERWORK</th>
                <th>NEW REG NUMBER</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong style={{ color: 'var(--blue)', fontSize: 12 }}>{t.transferCertificateNumber}</strong>
                  </td>
                  <td>
                    <strong>{t.agreement.driverName}</strong>
                    <small style={{ color: 'var(--muted)', display: 'block' }}>{t.agreement.agreementNumber}</small>
                  </td>
                  <td>
                    {t.agreement.vehicle ? `${t.agreement.vehicle.make} ${t.agreement.vehicle.model}` : 'Fleet Unit'}
                  </td>
                  <td>
                    <span className="pill good" style={{ fontSize: 10, padding: '2px 6px' }}>
                      ✓ Payoff Verified
                    </span>
                    <small style={{ color: 'var(--muted)', display: 'block', fontSize: 10 }}>By {t.payoffVerifiedBy}</small>
                  </td>
                  <td>
                    <span
                      className={`pill ${
                        t.dvlaPaperworkStatus === 'COMPLETED' ? 'good' :
                        t.dvlaPaperworkStatus === 'DVLA_PROCESSING' ? 'tone-blue' : 'tone-warn'
                      }`}
                      style={{ fontSize: 10, padding: '2px 8px' }}
                    >
                      {t.dvlaPaperworkStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{t.newRegistrationNumber || 'Pending DVLA'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTransfer(t);
                        setStatus(t.dvlaPaperworkStatus);
                        setRegNum(t.newRegistrationNumber || '');
                        setNotes(t.notes || '');
                      }}
                      className="btn btn-ghost"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Update Transfer Modal */}
      {selectedTransfer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, padding: 24, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>Update DVLA Paperwork Status</strong>
              <button type="button" onClick={() => setSelectedTransfer(null)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Driver: <strong>{selectedTransfer.agreement.driverName}</strong> (Cert: {selectedTransfer.transferCertificateNumber})
            </p>

            <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  DVLA Transfer Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="field"
                >
                  <option value="PENDING_CLEARANCE">Pending Executive Clearance</option>
                  <option value="PAPERS_SUBMITTED">Form C &amp; Transfer Papers Submitted</option>
                  <option value="DVLA_PROCESSING">DVLA Inspection &amp; Processing</option>
                  <option value="COMPLETED">Ownership Formally Transferred (Title Issued)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  New Driver Registration Number
                </label>
                <input
                  type="text"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  placeholder="e.g. GW-8129-26"
                  className="field"
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  DVLA Submission Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="DVLA office location, officer in charge..."
                  className="field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setSelectedTransfer(null)} className="btn btn-ghost">
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'SAVING...' : 'SAVE DVLA STATUS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
