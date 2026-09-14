'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

export default function PayDuesButton({
  amountGhs,
  memberId,
  variant = 'primary'
}: {
  amountGhs: number;
  memberId: string;
  variant?: 'primary' | 'compact';
}) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'ANNUAL_DUES',
          memberId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize dues payment');

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      alert(err.message || 'Payment initialization failed. Please try again.');
      setLoading(false);
    }
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="btn btn-primary"
        style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
        {loading ? 'PAYING...' : `PAY GHS ${amountGhs.toFixed(2)}`}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="btn btn-primary"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '10px 20px' }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
      {loading ? 'INITIALIZING PAYSTACK...' : `PAY ANNUAL DUES — GHS ${amountGhs.toFixed(2)}`}
    </button>
  );
}
