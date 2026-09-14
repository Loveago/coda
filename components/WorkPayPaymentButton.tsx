'use client';

import { useState } from 'react';
import { CreditCard, DollarSign, Loader2, X } from 'lucide-react';

export default function WorkPayPaymentButton({
  agreementId,
  weeklyAmount,
  defaultAmount,
  label = 'MAKE PAYMENT'
}: {
  agreementId: string;
  weeklyAmount: number;
  defaultAmount?: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(defaultAmount || weeklyAmount));
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'WORK_PAY_INSTALLMENT',
          agreementId,
          amount: numericAmount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment initialization failed');

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      alert(err.message || 'Payment initialization failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}
      >
        <CreditCard size={16} />
        {label}
      </button>

      {open && (
        <div className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="panel" style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 12, padding: 24, display: 'grid', gap: 16, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} />
                </span>
                <strong style={{ fontSize: 16 }}>Make Work &amp; Pay Remittance</strong>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Remit your weekly installment or pay in advance. Your balance will be credited immediately upon verification.
            </p>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                Remittance Amount (GHS)
              </label>
              <input
                type="number"
                min="10"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="field"
                style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setAmount(String(weeklyAmount))}
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  1 Week (GHS {weeklyAmount})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(String(weeklyAmount * 2))}
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  2 Weeks (GHS {weeklyAmount * 2})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(String(weeklyAmount * 4))}
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  4 Weeks (GHS {weeklyAmount * 4})
                </button>
              </div>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
              <strong>Supported Payment Channels:</strong>
              <p style={{ margin: '4px 0 0' }}>
                MTN Mobile Money, Telecel Cash, AT Money, Debit/Credit Card (Visa &amp; Mastercard).
              </p>
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px 20px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {loading ? 'INITIALIZING PAYSTACK...' : `PROCEED TO PAY GHS ${parseFloat(amount || '0').toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
