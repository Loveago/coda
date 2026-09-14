'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CarFront,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus2,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Users,
  X
} from 'lucide-react';

interface Agreement {
  id: string;
  agreementNumber: string;
  driverName: string;
  driverPhone: string;
  driverEmail: string | null;
  totalPrice: number;
  depositRequired: number;
  depositPaid: number;
  weeklyPayment: number;
  durationWeeks: number;
  startDate: string;
  totalPaid: number;
  remainingBalance: number;
  status: string;
  vehicle?: { make: string; model: string; year: number } | null;
  installments?: any[];
  payments?: any[];
}

const statuses = [
  'ALL',
  'ACTIVE',
  'IN_ARREARS',
  'PENDING_SIGNATURE',
  'COMPLETED',
  'DEFAULTED',
  'SUSPENDED'
];

export default function AdminWorkPayAgreementsManager({
  initialCreate = false,
  applicantId
}: {
  initialCreate?: boolean;
  applicantId?: string;
}) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // New Agreement Modal State
  const [openModal, setOpenModal] = useState(initialCreate);
  const [approvedApplicants, setApprovedApplicants] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  // Form Fields
  const [selectedAppId, setSelectedAppId] = useState(applicantId || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [agreementType, setAgreementType] = useState<'WORK_PAY' | 'DAILY_SALES'>('WORK_PAY');
  const [dailySalesRate, setDailySalesRate] = useState('150');
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState('6');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [totalPrice, setTotalPrice] = useState('120000');
  const [depositRequired, setDepositRequired] = useState('5000');
  const [weeklyPayment, setWeeklyPayment] = useState('800');
  const [durationWeeks, setDurationWeeks] = useState('104');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [gracePeriodDays, setGracePeriodDays] = useState('3');
  const [latePenaltyFee, setLatePenaltyFee] = useState('50');
  const [handoverMileage, setHandoverMileage] = useState('45000');

  useEffect(() => {
    fetchAgreements();
  }, [statusFilter]);

  useEffect(() => {
    if (openModal) {
      fetchModalData();
    }
  }, [openModal]);

  async function fetchAgreements() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/work-and-pay/agreements?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok && data.agreements) setAgreements(data.agreements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchModalData() {
    try {
      const [appsRes, vehRes] = await Promise.all([
        fetch('/api/admin/work-and-pay/applications?status=APPROVED'),
        fetch('/api/vehicles') // or fallback
      ]);
      const appsData = await appsRes.json();
      if (appsData.applications) {
        setApprovedApplicants(appsData.applications);
        if (applicantId) {
          const match = appsData.applications.find((a: any) => a.id === applicantId);
          if (match) {
            setDriverName(match.fullName);
            setDriverPhone(match.phone);
            setDriverEmail(match.email);
          }
        }
      }

      const vehData = await vehRes.json().catch(() => null);
      if (vehData && Array.isArray(vehData.vehicles) && vehData.vehicles.length > 0) {
        setVehicles(vehData.vehicles);
        const first = vehData.vehicles[0];
        setSelectedVehicleId(first.id);
        const price = Number(first.price || 110000);
        setTotalPrice(String(price));
        const dep = 5000;
        setDepositRequired(String(dep));
        const weeks = parseInt(durationWeeks) || 104;
        setWeeklyPayment(String(Math.ceil((price - dep) / weeks)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleApplicantSelect(id: string) {
    setSelectedAppId(id);
    const applicant = approvedApplicants.find((a) => a.id === id);
    if (applicant) {
      setDriverName(applicant.fullName);
      setDriverPhone(applicant.phone);
      setDriverEmail(applicant.email);
    }
  }

  function handleVehicleSelect(id: string) {
    setSelectedVehicleId(id);
    const v = vehicles.find((item) => item.id === id);
    if (v) {
      if (v.programType === 'DAILY_SALES' && v.dailySalesRate) {
        setAgreementType('DAILY_SALES');
        const daily = Number(v.dailySalesRate);
        const days = v.workingDaysPerWeek || 6;
        const weekly = v.dailySalesWeeklyTarget ? Number(v.dailySalesWeeklyTarget) : daily * days;
        const dep = v.dailySalesDeposit ? Number(v.dailySalesDeposit) : 2000;
        const weeks = parseInt(durationWeeks) || 52;
        setDailySalesRate(String(daily));
        setWorkingDaysPerWeek(String(days));
        setWeeklyPayment(String(weekly));
        setDepositRequired(String(dep));
        setTotalPrice(String(weekly * weeks));
      } else {
        setAgreementType('WORK_PAY');
        const price = Number(v.workPayPrice || v.price || 110000);
        const dep = Number(v.workPayDeposit || 5000);
        const weeks = Number(v.workPayWeeks || parseInt(durationWeeks) || 104);
        setTotalPrice(String(price));
        setDepositRequired(String(dep));
        setDurationWeeks(String(weeks));
        const weekly = v.workPayWeekly ? Number(v.workPayWeekly) : Math.ceil((price - dep) / weeks);
        setWeeklyPayment(String(weekly));
      }
    }
  }

  async function handleCreateAgreement(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormErr(null);

    try {
      const res = await fetch('/api/admin/work-and-pay/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedAppId || undefined,
          vehicleId: selectedVehicleId,
          agreementType,
          dailySalesRate: agreementType === 'DAILY_SALES' ? parseFloat(dailySalesRate) : undefined,
          workingDaysPerWeek: agreementType === 'DAILY_SALES' ? parseInt(workingDaysPerWeek) : undefined,
          driverName,
          driverPhone,
          driverEmail: driverEmail || undefined,
          totalPrice: parseFloat(totalPrice),
          depositRequired: parseFloat(depositRequired),
          weeklyPayment: parseFloat(weeklyPayment),
          durationWeeks: parseInt(durationWeeks),
          startDate,
          gracePeriodDays: parseInt(gracePeriodDays),
          latePenaltyFee: parseFloat(latePenaltyFee),
          handoverMileage: parseInt(handoverMileage)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate contract schedule.');

      setOpenModal(false);
      fetchAgreements();
    } catch (err: any) {
      setFormErr(err.message || 'Error creating agreement.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = agreements.filter((a) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      a.driverName.toLowerCase().includes(term) ||
      a.agreementNumber.toLowerCase().includes(term) ||
      a.driverPhone.includes(term)
    );
  });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Control Header */}
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

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agreement, driver, phone..."
            className="field"
            style={{ width: 220, padding: '6px 10px', fontSize: 12.5 }}
          />
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 14px' }}
          >
            <Plus size={15} /> NEW AGREEMENT
          </button>
        </div>
      </div>

      {/* Agreements Table */}
      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading agreements...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
            No Work &amp; Pay agreements match this filter. Click &quot;New Agreement&quot; to establish a contract.
          </p>
        ) : (
          <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>CONTRACT CODE</th>
                <th>DRIVER</th>
                <th>VEHICLE</th>
                <th>TOTAL PRICE</th>
                <th>PAID TO DATE</th>
                <th>PROGRESS</th>
                <th>WEEKLY REMITTANCE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const total = Number(a.totalPrice);
                const paid = Number(a.totalPaid || 0);
                const pct = Math.min(100, Math.round((paid / total) * 100));

                return (
                  <tr key={a.id}>
                    <td>
                      <code style={{ fontSize: 11 }}>{a.agreementNumber}</code>
                    </td>
                    <td>
                      <strong>{a.driverName}</strong>
                      <small style={{ color: 'var(--muted)', display: 'block' }}>{a.driverPhone}</small>
                    </td>
                    <td>
                      {a.vehicle ? `${a.vehicle.make} ${a.vehicle.model}` : 'Assigned Fleet'}
                    </td>
                    <td>GHS {total.toLocaleString()}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>GHS {paid.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: a.status === 'IN_ARREARS' ? '#ef4444' : '#2563eb' }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <strong>GHS {Number(a.weeklyPayment).toLocaleString()} / wk</strong>
                    </td>
                    <td>
                      <span
                        className={`pill ${
                          a.status === 'ACTIVE' ? 'good' :
                          a.status === 'IN_ARREARS' ? 'bad' :
                          a.status === 'COMPLETED' ? 'tone-blue' : 'muted'
                        }`}
                        style={{ fontSize: 10, padding: '2px 8px' }}
                      >
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/work-and-pay/agreements/${a.id}`}
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={12} /> Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Agreement Creation Modal */}
      {openModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 12,
              padding: 26,
              display: 'grid',
              gap: 18
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FilePlus2 size={20} style={{ color: 'var(--blue)' }} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Create New Work &amp; Pay Agreement</h3>
              </div>
              <button type="button" onClick={() => setOpenModal(false)} className="btn btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {formErr && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{formErr}</span>
              </div>
            )}

            <form onSubmit={handleCreateAgreement} style={{ display: 'grid', gap: 16 }}>
              {/* Step 1: Link Driver */}
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--line)', display: 'grid', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>1. DRIVER SELECTION</span>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                    Select Approved Applicant (Optional)
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => handleApplicantSelect(e.target.value)}
                    className="field"
                  >
                    <option value="">-- Manual Driver Entry or Select Approved Candidate --</option>
                    {approvedApplicants.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.fullName} ({app.phone} · Score: {app.interviewScore || 'Approved'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Driver Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Kwame Mensah"
                      className="field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Driver Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+233 24 000 0000"
                      className="field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Driver Email
                    </label>
                    <input
                      type="email"
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      placeholder="driver@example.com"
                      className="field"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Vehicle & Handover */}
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--line)', display: 'grid', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>2. FLEET ASSIGNMENT</span>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Assign Vehicle Model *
                    </label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      className="field"
                      required
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber ? `[${v.registrationNumber}] ` : ''}{v.year} {v.make} {v.model} ({v.programType || 'WORK_PAY'}) — GHS {v.workPayWeekly ? `${Number(v.workPayWeekly).toLocaleString()}/wk` : `${Number(v.price).toLocaleString()} buyout`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Handover Mileage (km)
                    </label>
                    <input
                      type="number"
                      value={handoverMileage}
                      onChange={(e) => setHandoverMileage(e.target.value)}
                      className="field"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Financial Terms & Amortization */}
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--line)', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
                    3. FINANCIAL TERMS &amp; AUTO-AMORTIZATION SCHEDULE
                  </span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: agreementType === 'WORK_PAY' ? 'var(--blue)' : 'var(--muted)' }}>
                      <input
                        type="radio"
                        name="modalAgreementType"
                        value="WORK_PAY"
                        checked={agreementType === 'WORK_PAY'}
                        onChange={() => setAgreementType('WORK_PAY')}
                      />
                      Work &amp; Pay
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: agreementType === 'DAILY_SALES' ? '#b45309' : 'var(--muted)' }}>
                      <input
                        type="radio"
                        name="modalAgreementType"
                        value="DAILY_SALES"
                        checked={agreementType === 'DAILY_SALES'}
                        onChange={() => setAgreementType('DAILY_SALES')}
                      />
                      Daily Sales
                    </label>
                  </div>
                </div>

                {agreementType === 'DAILY_SALES' && (
                  <div style={{ padding: 10, background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#92400e', display: 'block', marginBottom: 4 }}>
                        Daily Sales Rate (GHS/day) *
                      </label>
                      <input
                        type="number"
                        value={dailySalesRate}
                        onChange={(e) => {
                          const rate = e.target.value;
                          setDailySalesRate(rate);
                          const weekly = (Number(rate) || 0) * (Number(workingDaysPerWeek) || 6);
                          setWeeklyPayment(String(weekly));
                          setTotalPrice(String(weekly * (Number(durationWeeks) || 52)));
                        }}
                        className="field"
                        style={{ fontWeight: 700, color: '#b45309' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#92400e', display: 'block', marginBottom: 4 }}>
                        Working Days / Week
                      </label>
                      <select
                        value={workingDaysPerWeek}
                        onChange={(e) => {
                          const days = e.target.value;
                          setWorkingDaysPerWeek(days);
                          const weekly = (Number(dailySalesRate) || 0) * (Number(days) || 6);
                          setWeeklyPayment(String(weekly));
                          setTotalPrice(String(weekly * (Number(durationWeeks) || 52)));
                        }}
                        className="field"
                      >
                        <option value="5">5 Days (Mon - Fri)</option>
                        <option value="6">6 Days (Mon - Sat · Sun off)</option>
                        <option value="7">7 Days (Full week)</option>
                      </select>
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Total Target Price (GHS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Security Deposit (GHS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={depositRequired}
                      onChange={(e) => setDepositRequired(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Weekly Payment (GHS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={weeklyPayment}
                      onChange={(e) => setWeeklyPayment(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Duration (Weeks) *
                    </label>
                    <select
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(e.target.value)}
                      className="field"
                    >
                      <option value="78">78 Weeks (1.5 Years)</option>
                      <option value="104">104 Weeks (2.0 Years)</option>
                      <option value="156">156 Weeks (3.0 Years)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                      Late Fee (GHS)
                    </label>
                    <input
                      type="number"
                      value={latePenaltyFee}
                      onChange={(e) => setLatePenaltyFee(e.target.value)}
                      className="field"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="btn btn-ghost"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <FilePlus2 size={16} />}
                  {submitting ? 'GENERATING SCHEDULE...' : 'EXECUTE & GENERATE SCHEDULE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
