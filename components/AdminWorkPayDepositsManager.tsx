'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  History,
  Loader2,
  MinusCircle,
  RefreshCcw,
  ShieldCheck,
  X
} from 'lucide-react';

interface AgreementDeposit {
  id: string;
  agreementNumber: string;
  driverName: string;
  driverPhone: string;
  depositRequired: number;
  depositPaid: number;
  status: string;
  vehicle?: { make: string; model: string } | null;
  securityDeposits?: any[];
}

export default function AdminWorkPayDepositsManager() {
  const [agreements, setAgreements] = useState<AgreementDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalItem, setModalItem] = useState<{ agreement: AgreementDeposit; mode: 'DEDUCT' | 'REFUND' } | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, []);

  async function fetchDeposits() {
    try {
      const res = await fetch('/api/admin/work-and-pay/deposits');
      const data = await res.json();
      if (res.ok && data.agreements) setAgreements(data.agreements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!modalItem) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/work-and-pay/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: modalItem.agreement.id,
          action: modalItem.mode,
          amount: parseFloat(amount),
          reason: reason.trim() || undefined
        })
      });

      if (!res.ok) throw new Error('Operation failed.');

      setModalItem(null);
      setAmount('');
      setReason('');
      fetchDeposits();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalDepositsHeld = agreements.reduce((sum, a) => sum + Number(a.depositPaid || 0), 0);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="panel" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>TOTAL SECURITY DEPOSITS HELD</span>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 2px', color: '#059669' }}>
            GHS {totalDepositsHeld.toLocaleString()}
          </h2>
          <small style={{ color: 'var(--muted)', fontSize: 11 }}>Held in trust across active fleet contracts</small>
        </div>

        <div className="panel" style={{ padding: 18, borderLeft: '4px solid #2563eb' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>ESCROW SECURITY POLICY</span>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
            Security deposits protect against physical body/mechanical damage and unpaid arrears. Fully refundable upon contract completion.
          </p>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading security deposits...</p>
          </div>
        ) : agreements.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No vehicle agreements with security deposits recorded.
          </p>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>CONTRACT</th>
                <th>DRIVER</th>
                <th>VEHICLE</th>
                <th>REQUIRED DEPOSIT</th>
                <th>DEPOSIT PAID</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a) => {
                const req = Number(a.depositRequired || 0);
                const paid = Number(a.depositPaid || 0);
                const isPaid = paid >= req && req > 0;

                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/work-and-pay/agreements/${a.id}`} style={{ fontWeight: 600, color: 'var(--blue)' }}>
                        {a.agreementNumber}
                      </Link>
                    </td>
                    <td>
                      <strong>{a.driverName}</strong>
                      <small style={{ color: 'var(--muted)', display: 'block' }}>{a.driverPhone}</small>
                    </td>
                    <td>{a.vehicle ? `${a.vehicle.make} ${a.vehicle.model}` : 'Fleet Unit'}</td>
                    <td>GHS {req.toLocaleString()}</td>
                    <td>
                      <strong style={{ color: isPaid ? '#059669' : '#d97706' }}>
                        GHS {paid.toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <span className={`pill ${isPaid ? 'good' : 'tone-warn'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {isPaid ? 'HELD IN ESCROW' : 'PENDING DEPOSIT'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setModalItem({ agreement: a, mode: 'DEDUCT' });
                            setAmount('500');
                          }}
                          className="btn btn-ghost"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Deduct
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalItem({ agreement: a, mode: 'REFUND' });
                            setAmount(String(paid));
                          }}
                          className="btn btn-ghost"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Deduct or Refund Modal */}
      {modalItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 12, padding: 24, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>
                {modalItem.mode === 'DEDUCT' ? 'Record Deposit Deduction' : 'Process Deposit Refund'}
              </strong>
              <button type="button" onClick={() => setModalItem(null)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Driver: <strong>{modalItem.agreement.driverName}</strong> ({modalItem.agreement.agreementNumber})
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Amount (GHS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Reason / Justification *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={modalItem.mode === 'DEDUCT' ? 'e.g. Front bumper repair after incident' : 'e.g. Successful contract completion'}
                  className="field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setModalItem(null)} className="btn btn-ghost">
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'PROCESSING...' : modalItem.mode === 'DEDUCT' ? 'CONFIRM DEDUCTION' : 'CONFIRM REFUND'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
