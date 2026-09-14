'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CarFront,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  Loader2,
  Plus,
  Wrench,
  X
} from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  serviceType: string;
  serviceDate: string;
  mileage: number | null;
  cost: number;
  paidBy: string;
  serviceCenter: string | null;
  notes: string | null;
  status: string;
  agreement?: {
    id: string;
    agreementNumber: string;
    driverName: string;
    vehicle?: { make: string; model: string; year: number } | null;
  } | null;
}

export default function AdminWorkPayMaintenanceManager() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Record Modal
  const [openModal, setOpenModal] = useState(false);
  const [agreementId, setAgreementId] = useState('');
  const [serviceType, setServiceType] = useState('OIL_CHANGE');
  const [cost, setCost] = useState('250');
  const [paidBy, setPaidBy] = useState('DRIVER');
  const [mileage, setMileage] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/work-and-pay/maintenance');
      const data = await res.json();
      if (res.ok) {
        if (data.maintenance) setRecords(data.maintenance);
        if (data.agreements) setAgreements(data.agreements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/work-and-pay/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId,
          serviceType,
          cost: parseFloat(cost) || 0,
          paidBy,
          mileage: mileage ? parseInt(mileage) : undefined,
          serviceCenter: serviceCenter.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to create record.');

      setOpenModal(false);
      setMileage('');
      setNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Fleet Maintenance &amp; Servicing Log</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
            {records.length} total logged maintenance events across active fleet
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
        >
          <Plus size={15} /> LOG MAINTENANCE EVENT
        </button>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading maintenance records...</p>
          </div>
        ) : records.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No vehicle maintenance records logged yet.
          </p>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>DATE</th>
                <th>DRIVER / VEHICLE</th>
                <th>SERVICE TYPE</th>
                <th>MILEAGE</th>
                <th>COST</th>
                <th>PAID BY</th>
                <th>GARAGE / CENTER</th>
                <th>NOTES</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateFormatter.format(new Date(r.serviceDate))}</td>
                  <td>
                    <strong>{r.agreement?.driverName || '—'}</strong>
                    <small style={{ color: 'var(--muted)', display: 'block' }}>
                      {r.agreement?.vehicle ? `${r.agreement.vehicle.make} ${r.agreement.vehicle.model}` : r.agreement?.agreementNumber}
                    </small>
                  </td>
                  <td>
                    <span className="pill tone-blue" style={{ fontSize: 10, padding: '2px 6px' }}>
                      {r.serviceType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{r.mileage ? `${r.mileage.toLocaleString()} km` : '—'}</td>
                  <td>
                    <strong>GHS {Number(r.cost).toFixed(2)}</strong>
                  </td>
                  <td>{r.paidBy}</td>
                  <td>{r.serviceCenter || '—'}</td>
                  <td style={{ color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, padding: 24, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={18} style={{ color: 'var(--blue)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Log Fleet Maintenance</h3>
              </div>
              <button type="button" onClick={() => setOpenModal(false)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Vehicle Agreement *
                </label>
                <select
                  required
                  value={agreementId}
                  onChange={(e) => setAgreementId(e.target.value)}
                  className="field"
                >
                  <option value="">-- Select active contract --</option>
                  {agreements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.driverName} ({a.vehicle ? `${a.vehicle.make} ${a.vehicle.model}` : a.agreementNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Service Type *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="field"
                >
                  <option value="OIL_CHANGE">Oil Change &amp; Filter</option>
                  <option value="TIRES">Tire Replacement</option>
                  <option value="BRAKES">Brakes &amp; Fluid</option>
                  <option value="ENGINE">Engine Diagnostics / Mechanical</option>
                  <option value="INSURANCE_RENEWAL">Insurance Renewal</option>
                  <option value="ROADWORTHY_RENEWAL">Roadworthiness Certification</option>
                  <option value="ROUTINE_INSPECTION">Quarterly Routine Inspection</option>
                  <option value="OTHER">Other Repair</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Cost (GHS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Responsibility *
                  </label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="field"
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="AGENCY">Agency</option>
                    <option value="SPLIT">Split (50/50)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g. 52000"
                    className="field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Service Center
                  </label>
                  <input
                    type="text"
                    value={serviceCenter}
                    onChange={(e) => setServiceCenter(e.target.value)}
                    placeholder="e.g. Depot Workshop"
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Notes &amp; Details
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Parts replaced, inspection checklist notes..."
                  className="field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setOpenModal(false)} className="btn btn-ghost">
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'SAVING...' : 'SAVE RECORD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
