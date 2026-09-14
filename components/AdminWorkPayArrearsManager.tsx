'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  Eye,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  ShieldAlert
} from 'lucide-react';

interface DelinquentAccount {
  agreementId: string;
  agreementNumber: string;
  driverName: string;
  driverPhone: string;
  driverEmail: string | null;
  vehicle?: { make: string; model: string; year: number } | null;
  weeklyPayment: number;
  status: string;
  totalOverdueAmount: number;
  maxDaysDelinquent: number;
  overdueInstallments: {
    id: string;
    weekNumber: number;
    dueDate: string;
    owing: number;
    daysDelinquent: number;
  }[];
}

export default function AdminWorkPayArrearsManager() {
  const [accounts, setAccounts] = useState<DelinquentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArrears();
  }, []);

  async function fetchArrears() {
    try {
      const res = await fetch('/api/admin/work-and-pay/arrears');
      const data = await res.json();
      if (res.ok && data.accounts) setAccounts(data.accounts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalArrearsGhs = accounts.reduce((sum, a) => sum + a.totalOverdueAmount, 0);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Top Banner Alert */}
      <div style={{ padding: '18px 24px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldAlert size={28} style={{ color: '#dc2626' }} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', margin: 0 }}>
              Delinquency &amp; Arrears Watchlist
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#b91c1c' }}>
              {accounts.length} driver accounts currently have installments past the contractual grace period.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', display: 'block' }}>TOTAL AT-RISK ARREARS</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>
            GHS {totalArrearsGhs.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Arrears Accounts Table */}
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Analyzing arrears ledger...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#059669' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>No Overdue Arrears 🎉</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              All active Work &amp; Pay vehicle agreements are in good standing within their grace periods.
            </p>
          </div>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>DRIVER &amp; PHONE</th>
                <th>CONTRACT / VEHICLE</th>
                <th>WEEKS MISSED</th>
                <th>MAX DELINQUENT</th>
                <th>TOTAL OWED</th>
                <th>QUICK CONTACT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.agreementId}>
                  <td>
                    <strong>{a.driverName}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: 11 }}>{a.driverPhone}</div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/work-and-pay/agreements/${a.agreementId}`}
                      style={{ color: 'var(--blue)', fontWeight: 600, display: 'block' }}
                    >
                      {a.agreementNumber}
                    </Link>
                    <small style={{ color: 'var(--muted)' }}>
                      {a.vehicle ? `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}` : 'Assigned Unit'}
                    </small>
                  </td>
                  <td>
                    <span className="pill bad" style={{ fontSize: 10, padding: '2px 8px' }}>
                      {a.overdueInstallments.length} Weeks Missed
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: a.maxDaysDelinquent > 14 ? '#dc2626' : '#d97706' }}>
                      {a.maxDaysDelinquent} Days Late
                    </strong>
                  </td>
                  <td>
                    <strong style={{ color: '#dc2626', fontSize: 13 }}>
                      GHS {a.totalOverdueAmount.toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a
                        href={`tel:${a.driverPhone}`}
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Call Driver"
                      >
                        <Phone size={12} /> Call
                      </a>
                      <a
                        href={`https://wa.me/${a.driverPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16a34a' }}
                        title="WhatsApp Driver"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/work-and-pay/agreements/${a.agreementId}`}
                      className="btn btn-primary"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      Manage Contract →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
