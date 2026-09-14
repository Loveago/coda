'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  History,
  Loader2,
  Plus,
  Search,
  X
} from 'lucide-react';

interface Payment {
  id: string;
  reference: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  channelDetails: string | null;
  receiptNumber: string | null;
  verifiedBy: string | null;
  status: string;
  notes: string | null;
  agreement?: {
    id: string;
    agreementNumber: string;
    driverName: string;
    driverPhone: string;
    vehicle?: { make: string; model: string } | null;
  } | null;
}

export default function AdminWorkPayPaymentsManager({ initialRecord = false }: { initialRecord?: boolean }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [openModal, setOpenModal] = useState(initialRecord);
  const [selectedAgreementId, setSelectedAgreementId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH_OFFLINE');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [methodFilter]);

  useEffect(() => {
    if (openModal) {
      fetchAgreements();
    }
  }, [openModal]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/work-and-pay/payments?method=${methodFilter}`);
      const data = await res.json();
      if (res.ok && data.payments) setPayments(data.payments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgreements() {
    try {
      const res = await fetch('/api/admin/work-and-pay/agreements?status=ACTIVE');
      const data = await res.json();
      if (data.agreements) setAgreements(data.agreements);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormErr(null);

    try {
      const res = await fetch('/api/admin/work-and-pay/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: selectedAgreementId,
          amount: parseFloat(amount),
          paymentMethod,
          receiptNumber: receiptNumber.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment.');

      setOpenModal(false);
      setAmount('');
      setReceiptNumber('');
      setNotes('');
      fetchPayments();
    } catch (err: any) {
      setFormErr(err.message || 'Error recording payment.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = payments.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.reference.toLowerCase().includes(term) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(term)) ||
      (p.agreement && p.agreement.driverName.toLowerCase().includes(term)) ||
      (p.agreement && p.agreement.agreementNumber.toLowerCase().includes(term))
    );
  });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Top Ledger Strip */}
      <div className="panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'PAYSTACK_MOMO', 'PAYSTACK_CARD', 'CASH_OFFLINE', 'BANK_TRANSFER'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethodFilter(m)}
              className="btn btn-ghost"
              style={{
                fontSize: 11.5,
                padding: '6px 12px',
                background: methodFilter === m ? 'var(--blue)' : 'transparent',
                color: methodFilter === m ? '#fff' : 'inherit',
                borderColor: methodFilter === m ? 'var(--blue)' : 'var(--line)'
              }}
            >
              {m === 'ALL' ? 'ALL METHODS' : m.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, driver, receipt..."
            className="field"
            style={{ width: 220, padding: '6px 10px', fontSize: 12.5 }}
          />
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 14px' }}
          >
            <Plus size={15} /> RECORD OFFLINE PAYMENT
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading payments ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No payment records found.
          </p>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>DATE &amp; TIME</th>
                <th>DRIVER / CONTRACT</th>
                <th>AMOUNT</th>
                <th>CHANNEL / METHOD</th>
                <th>REFERENCE #</th>
                <th>RECEIPT #</th>
                <th>VERIFIED BY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {dateFormatter.format(new Date(p.paymentDate))}
                  </td>
                  <td>
                    <strong>{p.agreement?.driverName || '—'}</strong>
                    {p.agreement && (
                      <Link
                        href={`/admin/work-and-pay/agreements/${p.agreement.id}`}
                        style={{ display: 'block', fontSize: 11, color: 'var(--blue)' }}
                      >
                        {p.agreement.agreementNumber}
                      </Link>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontSize: 13 }}>
                      GHS {Number(p.amount).toFixed(2)}
                    </strong>
                  </td>
                  <td>{p.channelDetails || p.paymentMethod.replace(/_/g, ' ')}</td>
                  <td>
                    <code style={{ fontSize: 11 }}>{p.reference}</code>
                  </td>
                  <td>
                    {p.receiptNumber ? (
                      <strong style={{ fontSize: 11.5, color: '#2563eb' }}>{p.receiptNumber}</strong>
                    ) : '—'}
                  </td>
                  <td>{p.verifiedBy || 'Paystack Automated'}</td>
                  <td>
                    <span className="pill good" style={{ fontSize: 10, padding: '2px 8px' }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Offline Payment Modal */}
      {openModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, padding: 24, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} style={{ color: 'var(--blue)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Record Offline Driver Payment</h3>
              </div>
              <button type="button" onClick={() => setOpenModal(false)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {formErr && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b', fontSize: 12 }}>
                {formErr}
              </div>
            )}

            <form onSubmit={handleRecordPayment} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Select Active Driver Agreement *
                </label>
                <select
                  required
                  value={selectedAgreementId}
                  onChange={(e) => {
                    setSelectedAgreementId(e.target.value);
                    const ag = agreements.find((a) => a.id === e.target.value);
                    if (ag) setAmount(String(ag.weeklyPayment));
                  }}
                  className="field"
                >
                  <option value="">-- Choose active agreement --</option>
                  {agreements.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.driverName} ({ag.agreementNumber} · Weekly: GHS {Number(ag.weeklyPayment).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="field"
                >
                  <option value="CASH_OFFLINE">Cash (Office Walk-in)</option>
                  <option value="BANK_TRANSFER">Direct Bank Deposit / Wire</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Remittance Amount (GHS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 800.00"
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
                  placeholder="Auto-generated if left blank"
                  className="field"
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Administrative Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Collected at depot"
                  className="field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setOpenModal(false)} className="btn btn-ghost">
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'RECORDING...' : 'RECORD & ISSUE RECEIPT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
