'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Car,
  CarFront,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  DollarSign,
  Edit2,
  FileCheck,
  Filter,
  Fuel,
  Gauge,
  KeyRound,
  MapPin,
  Plus,
  Radio,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Users,
  Wrench,
  X
} from 'lucide-react';

interface FleetVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  transmission: string | null;
  fuelType: string | null;
  seats: number | null;
  registrationNumber: string | null;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  programType: string;
  ownerType: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  ownerSharePct: number | null;
  workPayPrice: number | null;
  workPayDeposit: number | null;
  workPayWeekly: number | null;
  workPayWeeks: number | null;
  dailySalesRate: number | null;
  dailySalesDeposit: number | null;
  dailySalesWeeklyTarget: number | null;
  workingDaysPerWeek: number | null;
  insuranceExpiry: string | null;
  roadworthyExpiry: string | null;
  trackerInstalled: boolean;
  trackerDeviceId: string | null;
  imageUrl: string | null;
  availability: string;
  featured: boolean;
  images?: { id: string; url: string; position: number }[];
  workPayAgreements?: {
    id: string;
    agreementNumber: string;
    driverName: string;
    status: string;
    startDate: string;
  }[];
  _count?: {
    workPayApplications: number;
    workPayAgreements: number;
  };
}

export default function AdminWorkPayFleetManager({
  initialVehicles
}: {
  initialVehicles: FleetVehicle[];
}) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(initialVehicles);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const initialFormState = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Compact Hatchback',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    registrationNumber: '',
    vin: '',
    color: '',
    mileage: '',
    programType: 'WORK_PAY', // WORK_PAY, DAILY_SALES, BOTH
    ownerType: 'AGENCY', // AGENCY, FLEET_INVESTOR
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerSharePct: 85,
    workPayPrice: '',
    workPayDeposit: '',
    workPayWeekly: '',
    workPayWeeks: 104,
    dailySalesRate: '',
    dailySalesDeposit: '',
    dailySalesWeeklyTarget: '',
    workingDaysPerWeek: 6,
    insuranceExpiry: '',
    roadworthyExpiry: '',
    trackerInstalled: true,
    trackerDeviceId: '',
    imageUrl: '',
    description: '',
    availability: 'AVAILABLE'
  };

  const [formData, setFormData] = useState(initialFormState);

  // Auto calculate Work & Pay Weekly
  const handleCalcWorkPayWeekly = (priceStr: string, depositStr: string, weeksNum: number) => {
    const p = Number(priceStr) || 0;
    const d = Number(depositStr) || 0;
    const fin = Math.max(0, p - d);
    if (weeksNum > 0 && fin > 0) {
      return Math.ceil(fin / weeksNum).toString();
    }
    return '';
  };

  // Auto calculate Daily Sales Weekly Target
  const handleCalcDailyWeekly = (dailyRateStr: string, daysNum: number) => {
    const r = Number(dailyRateStr) || 0;
    if (r > 0 && daysNum > 0) {
      return (r * daysNum).toString();
    }
    return '';
  };

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setError(null);
    setSuccess(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (v: FleetVehicle) => {
    setEditingVehicle(v);
    setFormData({
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      transmission: v.transmission || 'Automatic',
      fuelType: v.fuelType || 'Petrol',
      seats: v.seats || 5,
      registrationNumber: v.registrationNumber || '',
      vin: v.vin || '',
      color: v.color || '',
      mileage: v.mileage ? String(v.mileage) : '',
      programType: v.programType || 'WORK_PAY',
      ownerType: v.ownerType || 'AGENCY',
      ownerName: v.ownerName || '',
      ownerPhone: v.ownerPhone || '',
      ownerEmail: v.ownerEmail || '',
      ownerSharePct: v.ownerSharePct ? Number(v.ownerSharePct) : 85,
      workPayPrice: v.workPayPrice ? String(v.workPayPrice) : '',
      workPayDeposit: v.workPayDeposit ? String(v.workPayDeposit) : '',
      workPayWeekly: v.workPayWeekly ? String(v.workPayWeekly) : '',
      workPayWeeks: v.workPayWeeks || 104,
      dailySalesRate: v.dailySalesRate ? String(v.dailySalesRate) : '',
      dailySalesDeposit: v.dailySalesDeposit ? String(v.dailySalesDeposit) : '',
      dailySalesWeeklyTarget: v.dailySalesWeeklyTarget ? String(v.dailySalesWeeklyTarget) : '',
      workingDaysPerWeek: v.workingDaysPerWeek || 6,
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.substring(0, 10) : '',
      roadworthyExpiry: v.roadworthyExpiry ? v.roadworthyExpiry.substring(0, 10) : '',
      trackerInstalled: v.trackerInstalled,
      trackerDeviceId: v.trackerDeviceId || '',
      imageUrl: v.imageUrl || (v.images && v.images[0] ? v.images[0].url : ''),
      description: '',
      availability: v.availability || 'AVAILABLE'
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingVehicle
        ? `/api/admin/work-and-pay/fleet/${editingVehicle.id}`
        : '/api/admin/work-and-pay/fleet';
      const method = editingVehicle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save vehicle');
      }

      // Refresh list
      const listRes = await fetch('/api/admin/work-and-pay/fleet');
      const listData = await listRes.json();
      if (listData.success) {
        setVehicles(listData.vehicles);
      }

      setSuccess(editingVehicle ? 'Vehicle updated successfully.' : 'Vehicle added to fleet successfully.');
      setTimeout(() => {
        setShowAddModal(false);
        setEditingVehicle(null);
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (vehicleId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/work-and-pay/fleet/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicleId ? { ...v, availability: newStatus } : v))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to retire this vehicle from the active fleet?')) return;

    try {
      const res = await fetch(`/api/admin/work-and-pay/fleet/${vehicleId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to retire vehicle');
        return;
      }

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, availability: 'RETIRED' } : v))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered list
  const filteredVehicles = vehicles.filter((v) => {
    if (programFilter !== 'ALL') {
      if (v.programType !== programFilter && v.programType !== 'BOTH') return false;
    }
    if (availabilityFilter !== 'ALL' && v.availability !== availabilityFilter) return false;
    if (ownerFilter !== 'ALL' && v.ownerType !== ownerFilter) return false;

    if (search.trim()) {
      const s = search.toLowerCase();
      const matchMake = v.make.toLowerCase().includes(s);
      const matchModel = v.model.toLowerCase().includes(s);
      const matchPlate = (v.registrationNumber || '').toLowerCase().includes(s);
      const matchVin = (v.vin || '').toLowerCase().includes(s);
      const matchOwner = (v.ownerName || '').toLowerCase().includes(s);
      if (!matchMake && !matchModel && !matchPlate && !matchVin && !matchOwner) return false;
    }

    return true;
  });

  // KPI Calculations
  const totalFleet = vehicles.length;
  const availableCount = vehicles.filter((v) => v.availability === 'AVAILABLE').length;
  const workPayCount = vehicles.filter((v) => v.programType === 'WORK_PAY' || v.programType === 'BOTH').length;
  const dailySalesCount = vehicles.filter((v) => v.programType === 'DAILY_SALES' || v.programType === 'BOTH').length;
  const investorCount = vehicles.filter((v) => v.ownerType === 'FLEET_INVESTOR').length;
  const maintenanceCount = vehicles.filter((v) => v.availability === 'UNDER_MAINTENANCE').length;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="panel" style={{ padding: 16, borderLeft: '4px solid #2563eb' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>TOTAL FLEET</span>
          <strong style={{ fontSize: 22, color: '#1e293b' }}>{totalFleet}</strong>
          <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Commercial vehicles</small>
        </div>
        <div className="panel" style={{ padding: 16, borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>AVAILABLE NOW</span>
          <strong style={{ fontSize: 22, color: '#10b981' }}>{availableCount}</strong>
          <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Ready for assignment</small>
        </div>
        <div className="panel" style={{ padding: 16, borderLeft: '4px solid #6366f1' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>WORK &amp; PAY SCHEME</span>
          <strong style={{ fontSize: 22, color: '#6366f1' }}>{workPayCount}</strong>
          <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Drive-to-own eligible</small>
        </div>
        <div className="panel" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>DAILY SALES SCHEME</span>
          <strong style={{ fontSize: 22, color: '#d97706' }}>{dailySalesCount}</strong>
          <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Commercial rental / target</small>
        </div>
        <div className="panel" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>INVESTOR CARS</span>
          <strong style={{ fontSize: 22, color: '#8b5cf6' }}>{investorCount}</strong>
          <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>Managed 3rd-party owners</small>
        </div>
        <div className="panel" style={{ padding: 16, borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block' }}>MAINTENANCE</span>
          <strong style={{ fontSize: 22, color: '#dc2626' }}>{maintenanceCount}</strong>
          <small style={{ color: 'var(--muted)', display: 'block', fontSize: 11, marginTop: 2 }}>In garage / servicing</small>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search by registration plate, make, model, VIN, or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
              />
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13 }}
          >
            <Plus size={16} /> ADD VEHICLE TO FLEET
          </button>
        </div>

        {/* Filter Pills Strip */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: 12.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Scheme:</span>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 12 }}
            >
              <option value="ALL">All Schemes</option>
              <option value="WORK_PAY">Work &amp; Pay Only</option>
              <option value="DAILY_SALES">Daily Sales Only</option>
              <option value="BOTH">Flexible / Both</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Status:</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 12 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Ownership:</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 12 }}
            >
              <option value="ALL">All Owners</option>
              <option value="AGENCY">Agency Fleet</option>
              <option value="FLEET_INVESTOR">Third-Party Investors</option>
            </select>
          </div>

          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12 }}>
            Showing <strong>{filteredVehicles.length}</strong> of {vehicles.length} vehicles
          </span>
        </div>
      </div>

      {/* Fleet Vehicles Table */}
      <div className="panel" style={{ overflowX: 'auto', padding: 0 }}>
        <table className="admin-table" style={{ width: '100%', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th>VEHICLE / REGISTRATION</th>
              <th>SCHEME / PROGRAM</th>
              <th>TERMS &amp; RATES</th>
              <th>OWNERSHIP</th>
              <th>COMPLIANCE &amp; TRACKER</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                  No vehicles found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((v) => {
                const img = v.imageUrl || (v.images && v.images[0] ? v.images[0].url : null);
                const isWorkPay = v.programType === 'WORK_PAY' || v.programType === 'BOTH';
                const isDailySales = v.programType === 'DAILY_SALES' || v.programType === 'BOTH';
                const activeContract = v.workPayAgreements && v.workPayAgreements.find((a) => a.status === 'ACTIVE' || a.status === 'IN_ARREARS');

                return (
                  <tr key={v.id}>
                    {/* Vehicle / Registration */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 6,
                            background: '#f1f5f9',
                            overflow: 'hidden',
                            position: 'relative',
                            flexShrink: 0
                          }}
                        >
                          {img ? (
                            <Image
                              src={img}
                              alt={`${v.make} ${v.model}`}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                              <CarFront size={22} />
                            </div>
                          )}
                        </div>
                        <div>
                          <strong style={{ fontSize: 13.5, display: 'block' }}>
                            {v.make} {v.model} ({v.year})
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            {v.registrationNumber ? (
                              <span
                                style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  fontWeight: 800,
                                  fontSize: 11,
                                  letterSpacing: '.5px',
                                  border: '1px solid #fde68a'
                                }}
                              >
                                {v.registrationNumber}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--muted)', fontSize: 11 }}>No Plate Assigned</span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                              {v.category} · {v.transmission}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Scheme / Program */}
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        {v.programType === 'WORK_PAY' && (
                          <span className="pill tone-blue" style={{ fontSize: 11, display: 'inline-block' }}>
                            WORK &amp; PAY
                          </span>
                        )}
                        {v.programType === 'DAILY_SALES' && (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'inline-block',
                              border: '1px solid #fcd34d'
                            }}
                          >
                            DAILY SALES
                          </span>
                        )}
                        {v.programType === 'BOTH' && (
                          <span
                            style={{
                              background: '#f3e8ff',
                              color: '#7e22ce',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'inline-block',
                              border: '1px solid #d8b4fe'
                            }}
                          >
                            BOTH / FLEXIBLE
                          </span>
                        )}
                        <small style={{ color: 'var(--muted)', fontSize: 10.5 }}>
                          {v.programType === 'WORK_PAY' ? 'Drive-to-own' : v.programType === 'DAILY_SALES' ? 'Commercial rental' : 'Flexible assignment'}
                        </small>
                      </div>
                    </td>

                    {/* Terms & Rates */}
                    <td>
                      <div style={{ fontSize: 11.5, display: 'grid', gap: 2 }}>
                        {isWorkPay && (
                          <div>
                            <span style={{ color: 'var(--muted)' }}>W&amp;P: </span>
                            <strong>GHS {Number(v.workPayWeekly || 0).toLocaleString()} / wk</strong>
                            <span style={{ color: 'var(--muted)', fontSize: 10.5 }}>
                              {' '}(GHS {Number(v.workPayPrice || 0).toLocaleString()} buyout)
                            </span>
                          </div>
                        )}
                        {isDailySales && (
                          <div>
                            <span style={{ color: 'var(--muted)' }}>Sales: </span>
                            <strong style={{ color: '#b45309' }}>GHS {Number(v.dailySalesRate || 0).toLocaleString()} / day</strong>
                            <span style={{ color: 'var(--muted)', fontSize: 10.5 }}>
                              {' '}(GHS {Number(v.dailySalesWeeklyTarget || (Number(v.dailySalesRate || 0) * (v.workingDaysPerWeek || 6))).toLocaleString()}/wk)
                            </span>
                          </div>
                        )}
                        <div>
                          <span style={{ color: 'var(--muted)' }}>Deposit: </span>
                          <span style={{ color: '#059669', fontWeight: 600 }}>
                            GHS {Number(v.workPayDeposit || v.dailySalesDeposit || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Ownership */}
                    <td>
                      <div>
                        {v.ownerType === 'AGENCY' ? (
                          <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>
                            Agency Fleet
                          </span>
                        ) : (
                          <div>
                            <span style={{ fontWeight: 700, color: '#7e22ce', fontSize: 12, display: 'block' }}>
                              {v.ownerName || 'Third-Party Investor'}
                            </span>
                            <small style={{ color: 'var(--muted)', fontSize: 10.5 }}>
                              {v.ownerPhone} · {v.ownerSharePct ? `${v.ownerSharePct}% Share` : ''}
                            </small>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Compliance & Tracker */}
                    <td>
                      <div style={{ display: 'grid', gap: 3, fontSize: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {v.trackerInstalled ? (
                            <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                              <Radio size={12} /> GPS Tracked
                            </span>
                          ) : (
                            <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <AlertTriangle size={12} /> No Tracker
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--muted)' }}>
                          Roadworthy: {v.roadworthyExpiry ? new Date(v.roadworthyExpiry).toLocaleDateString('en-GB') : 'Not Set'}
                        </div>
                        <div style={{ color: 'var(--muted)' }}>
                          Insurance: {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString('en-GB') : 'Not Set'}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <select
                          value={v.availability}
                          onChange={(e) => handleQuickStatusChange(v.id, e.target.value)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid var(--line)',
                            background:
                              v.availability === 'AVAILABLE'
                                ? '#ecfdf5'
                                : v.availability === 'ASSIGNED'
                                ? '#eff6ff'
                                : v.availability === 'UNDER_MAINTENANCE'
                                ? '#fffbeb'
                                : '#f1f5f9',
                            color:
                              v.availability === 'AVAILABLE'
                                ? '#065f46'
                                : v.availability === 'ASSIGNED'
                                ? '#1e40af'
                                : v.availability === 'UNDER_MAINTENANCE'
                                ? '#92400e'
                                : '#475569'
                          }}
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="ASSIGNED">Assigned</option>
                          <option value="UNDER_MAINTENANCE">Maintenance</option>
                          <option value="RETIRED">Retired</option>
                        </select>

                        {activeContract && (
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                            Driver: <strong>{activeContract.driverName}</strong>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Edit vehicle details and pricing"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626' }}
                          title="Retire vehicle from fleet"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT VEHICLE MODAL */}
      {(showAddModal || editingVehicle) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: 750,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 12,
              padding: 28,
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CarFront size={20} />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                    {editingVehicle ? 'Edit Fleet Vehicle' : 'Add New Vehicle to Fleet'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                    Configure vehicle specs, Work &amp; Pay / Daily Sales program terms, and fleet ownership.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingVehicle(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 6, fontSize: 12.5, marginBottom: 16 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 14px', background: '#ecfdf5', color: '#065f46', borderRadius: 6, fontSize: 12.5, marginBottom: 16 }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'grid', gap: 20 }}>
              {/* SECTION 1: BASIC VEHICLE SPECS */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Car size={16} style={{ color: 'var(--blue)' }} /> 1. Vehicle Identification &amp; Specs
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Make *</label>
                    <input
                      type="text"
                      placeholder="e.g. Toyota"
                      required
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. Vitz or Yaris"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Year *</label>
                    <input
                      type="number"
                      required
                      min={2005}
                      max={2030}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. GW-4521-22"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>VIN / Chassis Number</label>
                    <input
                      type="text"
                      placeholder="17-character VIN"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Silver, White, Black"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    >
                      <option value="Compact Hatchback">Compact Hatchback</option>
                      <option value="Sedan">Sedan</option>
                      <option value="Compact Sedan">Compact Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Minibus / Van">Minibus / Van</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Transmission</label>
                    <select
                      value={formData.transmission}
                      onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Fuel Type</label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Mileage (km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 52000"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Vehicle Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or uploaded image link"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* SECTION 2: PROGRAM SCHEME (WORK & PAY vs DAILY SALES) */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Coins size={16} style={{ color: '#d97706' }} /> 2. Operating Scheme &amp; Financial Terms
                </h3>

                {/* Scheme Picker Radio */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  <label
                    style={{
                      border: `2px solid ${formData.programType === 'WORK_PAY' ? 'var(--blue)' : 'var(--line)'}`,
                      background: formData.programType === 'WORK_PAY' ? '#eff6ff' : '#fff',
                      padding: 12,
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'block'
                    }}
                  >
                    <input
                      type="radio"
                      name="programType"
                      value="WORK_PAY"
                      checked={formData.programType === 'WORK_PAY'}
                      onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                      style={{ display: 'none' }}
                    />
                    <strong style={{ fontSize: 12.5, display: 'block', color: formData.programType === 'WORK_PAY' ? 'var(--blue)' : '#1e293b' }}>
                      Work &amp; Pay Only
                    </strong>
                    <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 2 }}>
                      Drive-to-own pathway with fixed weekly remittances until DVLA transfer.
                    </small>
                  </label>

                  <label
                    style={{
                      border: `2px solid ${formData.programType === 'DAILY_SALES' ? '#d97706' : 'var(--line)'}`,
                      background: formData.programType === 'DAILY_SALES' ? '#fffbeb' : '#fff',
                      padding: 12,
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'block'
                    }}
                  >
                    <input
                      type="radio"
                      name="programType"
                      value="DAILY_SALES"
                      checked={formData.programType === 'DAILY_SALES'}
                      onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                      style={{ display: 'none' }}
                    />
                    <strong style={{ fontSize: 12.5, display: 'block', color: formData.programType === 'DAILY_SALES' ? '#b45309' : '#1e293b' }}>
                      Daily Sales Only
                    </strong>
                    <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 2 }}>
                      Commercial rental. Fixed daily quota. Vehicle remains owner property.
                    </small>
                  </label>

                  <label
                    style={{
                      border: `2px solid ${formData.programType === 'BOTH' ? '#7e22ce' : 'var(--line)'}`,
                      background: formData.programType === 'BOTH' ? '#f3e8ff' : '#fff',
                      padding: 12,
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'block'
                    }}
                  >
                    <input
                      type="radio"
                      name="programType"
                      value="BOTH"
                      checked={formData.programType === 'BOTH'}
                      onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                      style={{ display: 'none' }}
                    />
                    <strong style={{ fontSize: 12.5, display: 'block', color: formData.programType === 'BOTH' ? '#7e22ce' : '#1e293b' }}>
                      Both / Flexible
                    </strong>
                    <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 2 }}>
                      Available for either Work &amp; Pay or Daily Sales depending on driver.
                    </small>
                  </label>
                </div>

                {/* WORK & PAY FINANCIALS */}
                {(formData.programType === 'WORK_PAY' || formData.programType === 'BOTH') && (
                  <div style={{ padding: 14, background: '#fff', borderRadius: 8, border: '1px solid #bfdbfe', marginBottom: 12 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--blue)', display: 'block', marginBottom: 8 }}>
                      WORK &amp; PAY TERMS (DRIVE-TO-OWN)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Total Buyout Price (GHS)</label>
                        <input
                          type="number"
                          placeholder="e.g. 110000"
                          value={formData.workPayPrice}
                          onChange={(e) => {
                            const newPrice = e.target.value;
                            const newWeekly = handleCalcWorkPayWeekly(newPrice, formData.workPayDeposit, formData.workPayWeeks);
                            setFormData({ ...formData, workPayPrice: newPrice, workPayWeekly: newWeekly || formData.workPayWeekly });
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Security Deposit (GHS)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={formData.workPayDeposit}
                          onChange={(e) => {
                            const newDep = e.target.value;
                            const newWeekly = handleCalcWorkPayWeekly(formData.workPayPrice, newDep, formData.workPayWeeks);
                            setFormData({ ...formData, workPayDeposit: newDep, workPayWeekly: newWeekly || formData.workPayWeekly });
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Duration (Weeks)</label>
                        <select
                          value={formData.workPayWeeks}
                          onChange={(e) => {
                            const newWeeks = Number(e.target.value);
                            const newWeekly = handleCalcWorkPayWeekly(formData.workPayPrice, formData.workPayDeposit, newWeeks);
                            setFormData({ ...formData, workPayWeeks: newWeeks, workPayWeekly: newWeekly || formData.workPayWeekly });
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                        >
                          <option value={52}>52 Weeks (~1 Year)</option>
                          <option value={78}>78 Weeks (~1.5 Years)</option>
                          <option value={104}>104 Weeks (~2 Years)</option>
                          <option value={156}>156 Weeks (~3 Years)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Weekly Remittance (GHS)</label>
                        <input
                          type="number"
                          placeholder="e.g. 800"
                          value={formData.workPayWeekly}
                          onChange={(e) => setFormData({ ...formData, workPayWeekly: e.target.value })}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DAILY SALES FINANCIALS */}
                {(formData.programType === 'DAILY_SALES' || formData.programType === 'BOTH') && (
                  <div style={{ padding: 14, background: '#fff', borderRadius: 8, border: '1px solid #fde68a' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b45309', display: 'block', marginBottom: 8 }}>
                      DAILY SALES TERMS (COMMERCIAL RENTAL / DAILY TARGET)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Daily Sales Rate (GHS/day)</label>
                        <input
                          type="number"
                          placeholder="e.g. 150"
                          value={formData.dailySalesRate}
                          onChange={(e) => {
                            const newRate = e.target.value;
                            const newTarget = handleCalcDailyWeekly(newRate, formData.workingDaysPerWeek);
                            setFormData({ ...formData, dailySalesRate: newRate, dailySalesWeeklyTarget: newTarget });
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, fontWeight: 700, color: '#b45309' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Working Days / Week</label>
                        <select
                          value={formData.workingDaysPerWeek}
                          onChange={(e) => {
                            const newDays = Number(e.target.value);
                            const newTarget = handleCalcDailyWeekly(formData.dailySalesRate, newDays);
                            setFormData({ ...formData, workingDaysPerWeek: newDays, dailySalesWeeklyTarget: newTarget });
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                        >
                          <option value={5}>5 Days (Mon - Fri)</option>
                          <option value={6}>6 Days (Mon - Sat · Sun off)</option>
                          <option value={7}>7 Days (Full week)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Security Deposit (GHS)</label>
                        <input
                          type="number"
                          placeholder="e.g. 2000"
                          value={formData.dailySalesDeposit}
                          onChange={(e) => setFormData({ ...formData, dailySalesDeposit: e.target.value })}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Weekly Sales Target (GHS)</label>
                        <input
                          type="number"
                          placeholder="Rate x Days"
                          value={formData.dailySalesWeeklyTarget}
                          onChange={(e) => setFormData({ ...formData, dailySalesWeeklyTarget: e.target.value })}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, fontWeight: 700, color: '#059669' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: FLEET OWNERSHIP / INVESTOR */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={16} style={{ color: '#7e22ce' }} /> 3. Vehicle Ownership &amp; Investor Terms
                </h3>

                <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="ownerType"
                      value="AGENCY"
                      checked={formData.ownerType === 'AGENCY'}
                      onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })}
                    />
                    Agency-Owned Fleet (Mr Truth Agency)
                  </label>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="ownerType"
                      value="FLEET_INVESTOR"
                      checked={formData.ownerType === 'FLEET_INVESTOR'}
                      onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })}
                    />
                    Third-Party Fleet Owner / Private Investor
                  </label>
                </div>

                {formData.ownerType === 'FLEET_INVESTOR' && (
                  <div style={{ padding: 14, background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Investor Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Kwesi Mensah"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Investor Phone *</label>
                      <input
                        type="tel"
                        placeholder="+233..."
                        value={formData.ownerPhone}
                        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Investor Email</label>
                      <input
                        type="email"
                        placeholder="investor@domain.com"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Owner Payout Share %</label>
                      <input
                        type="number"
                        placeholder="e.g. 85"
                        value={formData.ownerSharePct}
                        onChange={(e) => setFormData({ ...formData, ownerSharePct: Number(e.target.value) })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: COMPLIANCE & TRACKER */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} style={{ color: '#16a34a' }} /> 4. Tracker &amp; Regulatory Compliance
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>GPS Tracker</label>
                    <select
                      value={formData.trackerInstalled ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, trackerInstalled: e.target.value === 'yes' })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    >
                      <option value="yes">Installed &amp; Active</option>
                      <option value="no">Not Installed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Insurance Expiry Date</label>
                    <input
                      type="date"
                      value={formData.insuranceExpiry}
                      onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Roadworthiness Expiry Date</label>
                    <input
                      type="date"
                      value={formData.roadworthyExpiry}
                      onChange={(e) => setFormData({ ...formData, roadworthyExpiry: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingVehicle(null);
                  }}
                  className="btn btn-ghost"
                  style={{ padding: '8px 18px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '8px 24px', fontSize: 13, fontWeight: 700 }}
                >
                  {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Save to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
