'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CarFront,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileCheck2,
  History,
  Loader2,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  Printer,
  ShieldAlert,
  ShieldCheck,
  User,
  Wrench,
  X
} from 'lucide-react';

export default function AdminAgreementDetailClient({ agreement }: { agreement: any }) {
  const [currentStatus, setCurrentStatus] = useState(agreement.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Offline Payment Modal State
  const [openPayModal, setOpenPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(String(agreement.weeklyPayment));
  const [payMethod, setPayMethod] = useState<'CASH_OFFLINE' | 'BANK_TRANSFER'>('CASH_OFFLINE');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const totalPrice = Number(agreement.totalPrice);
  const totalPaid = Number(agreement.totalPaid || 0);
  const remaining = Number(agreement.remainingBalance || 0);
  const progressPct = Math.min(100, Math.round((totalPaid / totalPrice) * 100));

  const installments = agreement.installments || [];
  const payments = agreement.payments || [];
  const vehicle = agreement.vehicle;

  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Are you sure you want to change agreement status to ${newStatus}?`)) return;
    setUpdatingStatus(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/admin/work-and-pay/agreements/${agreement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');

      setCurrentStatus(newStatus);
      setStatusMsg(`Agreement marked as ${newStatus}.`);
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleRecordOfflinePayment(e: React.FormEvent) {
    e.preventDefault();
    setRecordingPay(true);
    try {
      const res = await fetch('/api/admin/work-and-pay/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: agreement.id,
          amount: parseFloat(payAmount),
          paymentMethod: payMethod,
          receiptNumber: receiptNumber.trim() || undefined,
          notes: payNotes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record offline payment.');

      setPaySuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Payment recording failed.');
      setRecordingPay(false);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Link
          href="/admin/work-and-pay/agreements"
          className="btn btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <ArrowLeft size={15} /> BACK TO AGREEMENTS
        </Link>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href={`/admin/work-and-pay/agreements/${agreement.id}/contract`}
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <Printer size={15} /> PRINT LEGAL CONTRACT
          </Link>

          <button
            type="button"
            onClick={() => setOpenPayModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <CreditCard size={15} /> RECORD OFFLINE PAYMENT
          </button>

          {currentStatus === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => handleStatusChange('SUSPENDED')}
              disabled={updatingStatus}
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
            >
              SUSPEND
            </button>
          )}

          {currentStatus === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={updatingStatus}
              className="btn btn-primary"
              style={{ fontSize: 12 }}
            >
              ACTIVATE
            </button>
          )}

          {currentStatus !== 'COMPLETED' && remaining <= 0 && (
            <button
              type="button"
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={updatingStatus}
              className="btn btn-primary"
              style={{ background: '#059669', borderColor: '#059669', fontSize: 12 }}
            >
              ✓ MARK COMPLETED (DVLA CLEARANCE)
            </button>
          )}

          {currentStatus !== 'DEFAULTED' && (
            <button
              type="button"
              onClick={() => handleStatusChange('DEFAULTED')}
              disabled={updatingStatus}
              className="btn btn-ghost"
              style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: 12 }}
            >
              DECLARE DEFAULT
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: 6, border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13 }}>
          {statusMsg}
        </div>
      )}

      {/* Top Financial Breakdown Card */}
      <div className="panel" style={{ padding: 24, borderTop: '4px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>
              AGREEMENT #{agreement.agreementNumber}
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '2px 0 4px' }}>{agreement.driverName}</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Phone: <strong>{agreement.driverPhone}</strong> · Vehicle: <strong>{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Assigned Unit'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              className={`pill ${
                currentStatus === 'ACTIVE' ? 'good' :
                currentStatus === 'IN_ARREARS' ? 'bad' :
                currentStatus === 'COMPLETED' ? 'tone-blue' : 'muted'
              }`}
              style={{ fontSize: 12, padding: '4px 14px' }}
            >
              {currentStatus.replace(/_/g, ' ')}
            </span>

            {agreement.driverSignature && agreement.agencySignature ? (
              <span className="pill good" style={{ fontSize: 11, padding: '4px 10px' }}>
                ✓ CONTRACT FULLY SIGNED
              </span>
            ) : agreement.driverSignature ? (
              <span className="pill" style={{ fontSize: 11, padding: '4px 10px', background: '#fef3c7', color: '#b45309' }}>
                PENDING AGENCY SIGNATURE
              </span>
            ) : (
              <span className="pill" style={{ fontSize: 11, padding: '4px 10px', background: '#fee2e2', color: '#b91c1c' }}>
                PENDING DRIVER SIGNATURE
              </span>
            )}
          </div>
        </div>

        {/* Equity Progress */}
        <div style={{ margin: '14px 0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span>
              Vehicle Equity Progress: <strong>GHS {totalPaid.toLocaleString()}</strong> of GHS {totalPrice.toLocaleString()}
            </span>
            <strong style={{ color: 'var(--blue)' }}>{progressPct}% Paid</strong>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: '#e2e8f0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #2563eb, #10b981)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>TOTAL PRICE</span>
            <strong style={{ fontSize: 17 }}>GHS {totalPrice.toLocaleString()}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>REMAINING BALANCE</span>
            <strong style={{ fontSize: 17, color: '#2563eb' }}>GHS {remaining.toLocaleString()}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>DEPOSIT PAID</span>
            <strong style={{ fontSize: 17, color: '#059669' }}>GHS {Number(agreement.depositPaid || 0).toLocaleString()}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>WEEKLY REMITTANCE</span>
            <strong style={{ fontSize: 17 }}>GHS {Number(agreement.weeklyPayment).toLocaleString()}</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>DURATION</span>
            <strong style={{ fontSize: 17 }}>{agreement.durationWeeks} Weeks</strong>
          </div>
        </div>
      </div>

      {/* Duo Grid: Payment Transactions + Installments Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Payments Ledger */}
        <div className="panel" style={{ padding: 20, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} style={{ color: 'var(--blue)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Payment Transactions</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpenPayModal(true)}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '4px 8px' }}
            >
              + Record Payment
            </button>
          </div>

          {payments.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 12.5, textAlign: 'center', padding: '24px 0' }}>
              No payments logged for this agreement yet.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {payments.map((p: any) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    fontSize: 12
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13 }}>GHS {Number(p.amount).toFixed(2)}</strong>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: 11 }}>
                      {dateFormatter.format(new Date(p.paymentDate))} · {p.channelDetails || p.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="pill good" style={{ fontSize: 9, padding: '2px 6px' }}>{p.status}</span>
                    <small style={{ color: 'var(--muted)', display: 'block', fontSize: 10 }}>{p.reference}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Installment Schedule */}
        <div className="panel" style={{ padding: 20, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} style={{ color: 'var(--blue)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Installment Amortization</h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{installments.length} Weeks</span>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', fontSize: 11.5 }}>
              <thead>
                <tr>
                  <th>WK</th>
                  <th>DUE DATE</th>
                  <th>TARGET</th>
                  <th>PAID</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((i: any) => (
                  <tr key={i.id} style={{ background: i.status === 'OVERDUE' ? '#fff5f5' : undefined }}>
                    <td><strong>#{i.weekNumber}</strong></td>
                    <td>{dateFormatter.format(new Date(i.dueDate))}</td>
                    <td>GHS {Number(i.targetAmount).toFixed(0)}</td>
                    <td style={{ color: i.status === 'PAID' ? '#059669' : undefined }}>
                      GHS {Number(i.amountPaid || 0).toFixed(0)}
                    </td>
                    <td>
                      <span className={`pill ${i.status === 'PAID' ? 'good' : i.status === 'OVERDUE' ? 'bad' : 'muted'}`} style={{ fontSize: 9, padding: '2px 6px' }}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Offline Payment Modal */}
      {openPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 12, padding: 24, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>Record Offline Driver Payment</strong>
              <button type="button" onClick={() => setOpenPayModal(false)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {paySuccess && (
              <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: 6, color: '#065f46', fontSize: 13 }}>
                ✓ Payment recorded and allocated to installments successfully!
              </div>
            )}

            <form onSubmit={handleRecordOfflinePayment} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="field"
                >
                  <option value="CASH_OFFLINE">Cash (Office Walk-in)</option>
                  <option value="BANK_TRANSFER">Direct Bank Deposit / Wire</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Amount Paid (GHS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Receipt / Bank Slip Number
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g. SLIP-89412"
                  className="field"
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Administrative Notes
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Received by cashier at Accra depot"
                  className="field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setOpenPayModal(false)} className="btn btn-ghost">
                  CANCEL
                </button>
                <button type="submit" disabled={recordingPay} className="btn btn-primary">
                  {recordingPay ? 'RECORDING...' : 'RECORD & ALLOCATE PAYMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
