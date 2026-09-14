'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, CheckCircle, Clock, DollarSign, Shield } from 'lucide-react';

export const SAMPLE_VEHICLES = [
  {
    name: 'Toyota Vitz (Echo / Yaris Hatch)',
    year: '2016 - 2019',
    category: 'Compact Hatchback',
    engine: '1.0L - 1.3L Petrol',
    fuelEconomy: '18 - 21 km/L',
    totalPrice: 110000,
    minDeposit: 5000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Bolt & Uber Eco / City commuting'
  },
  {
    name: 'Toyota Yaris Sedan / Belta',
    year: '2016 - 2020',
    category: 'Sedan',
    engine: '1.3L - 1.5L Petrol',
    fuelEconomy: '16 - 19 km/L',
    totalPrice: 125000,
    minDeposit: 6000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Bolt Comfort, UberX, Airport runs'
  },
  {
    name: 'Hyundai i10 Grand',
    year: '2017 - 2021',
    category: 'Compact Hatchback',
    engine: '1.2L Petrol',
    fuelEconomy: '17 - 20 km/L',
    totalPrice: 105000,
    minDeposit: 5000,
    defaultDurationWeeks: 104,
    recommendedFor: 'High fuel efficiency ride-hailing'
  },
  {
    name: 'Suzuki Swift Dzire',
    year: '2018 - 2022',
    category: 'Compact Sedan',
    engine: '1.2L Petrol',
    fuelEconomy: '19 - 22 km/L',
    totalPrice: 120000,
    minDeposit: 6000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Low maintenance daily commercial driving'
  },
  {
    name: 'Toyota Corolla (Altis / Axio)',
    year: '2015 - 2019',
    category: 'Executive Sedan',
    engine: '1.5L - 1.8L Petrol',
    fuelEconomy: '14 - 17 km/L',
    totalPrice: 145000,
    minDeposit: 8000,
    defaultDurationWeeks: 104,
    recommendedFor: 'Corporate car service & premium ride-hailing'
  }
];

export default function WorkPayCalculator() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [durationWeeks, setDurationWeeks] = useState(104);
  const [customDeposit, setCustomDeposit] = useState<number | null>(null);

  const vehicle = SAMPLE_VEHICLES[selectedIndex];
  const deposit = customDeposit !== null ? customDeposit : vehicle.minDeposit;
  const financed = Math.max(0, vehicle.totalPrice - deposit);
  const weeklyPayment = durationWeeks > 0 ? Math.ceil(financed / durationWeeks) : 0;
  const monthlyEstimate = Math.round(weeklyPayment * 4.33);
  const durationYears = (durationWeeks / 52).toFixed(1);

  return (
    <div className="panel" style={{ border: '1px solid var(--line)', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ width: 38, height: 38, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calculator size={20} />
        </span>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Work &amp; Pay Financing Calculator</h3>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
            Transparent weekly remittance, security deposit, and payoff timeline. No hidden charges.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Controls Column */}
        <div style={{ display: 'grid', gap: 18 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Select Sample Vehicle Model
            </label>
            <select
              value={selectedIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedIndex(idx);
                setCustomDeposit(SAMPLE_VEHICLES[idx].minDeposit);
              }}
              className="field"
              style={{ fontWeight: 600 }}
            >
              {SAMPLE_VEHICLES.map((v, i) => (
                <option key={v.name} value={i}>
                  {v.name} ({v.year}) — GHS {v.totalPrice.toLocaleString()}
                </option>
              ))}
            </select>
            <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
              Category: {vehicle.category} · Fuel: {vehicle.fuelEconomy}
            </small>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)' }}>
                Security Deposit: GHS {deposit.toLocaleString()}
              </label>
              <span style={{ fontSize: 11.5, color: 'var(--blue)', fontWeight: 600 }}>
                Min: GHS {vehicle.minDeposit.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={vehicle.minDeposit}
              max={Math.round(vehicle.totalPrice * 0.4)}
              step={1000}
              value={deposit}
              onChange={(e) => setCustomDeposit(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              <span>GHS {vehicle.minDeposit.toLocaleString()}</span>
              <span>GHS {(Math.round(vehicle.totalPrice * 0.4)).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)' }}>
                Contract Duration: {durationWeeks} Weeks (~{durationYears} Years)
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[78, 104, 156].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setDurationWeeks(w)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: durationWeeks === w ? '2px solid var(--blue)' : '1px solid var(--line)',
                    background: durationWeeks === w ? '#eff6ff' : '#fff',
                    color: durationWeeks === w ? 'var(--blue)' : 'inherit',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  {w} Weeks ({w === 78 ? '1.5 Yrs' : w === 104 ? '2.0 Yrs' : '3.0 Yrs'})
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            <span style={{ display: 'block', fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
              Best suited for: {vehicle.recommendedFor}
            </span>
            Includes mechanical pre-delivery inspection, initial comprehensive insurance, tracker installation, and full DVLA title transfer at completion.
          </div>
        </div>

        {/* Calculation Result Summary Column */}
        <div style={{ background: '#0f172a', color: '#fff', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#94a3b8' }}>
              WEEKLY ESTIMATED REMITTANCE
            </span>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#38bdf8', margin: '6px 0 2px' }}>
              GHS {weeklyPayment.toLocaleString()}
              <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}> / week</span>
            </div>
            <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>
              Approx. GHS {monthlyEstimate.toLocaleString()} / month
            </p>
          </div>

          <div style={{ margin: '20px 0', borderTop: '1px solid #334155', borderBottom: '1px solid #334155', padding: '14px 0', display: 'grid', gap: 10, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Total Buyout Target</span>
              <strong>GHS {vehicle.totalPrice.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Initial Security Deposit</span>
              <strong style={{ color: '#4ade80' }}>GHS {deposit.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Financed Vehicle Balance</span>
              <strong>GHS {financed.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Duration</span>
              <strong>{durationWeeks} Weeks ({durationYears} Years)</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <Link
              href={`/work-and-pay/apply?vehicle=${encodeURIComponent(vehicle.name)}&weeks=${durationWeeks}`}
              className="btn btn-primary"
              style={{ textAlign: 'center', fontWeight: 700, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              APPLY FOR THIS VEHICLE <ArrowRight size={16} />
            </Link>
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
              Subject to driver screening, license verification, and 2 credible guarantors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
