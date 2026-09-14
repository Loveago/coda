'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Wrench } from 'lucide-react';

export default function MemberMaintenanceForm({ agreementId }: { agreementId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [serviceType, setServiceType] = useState('OIL_CHANGE');
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [notes, setNotes] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch('/api/member/work-and-pay/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId,
          serviceType,
          mileage: mileage ? parseInt(mileage) : undefined,
          cost: cost ? parseFloat(cost) : 0,
          serviceCenter: serviceCenter.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit maintenance record.');

      setMsg({ type: 'ok', text: 'Maintenance record logged successfully.' });
      setNotes('');
      setCost('');
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Error recording maintenance.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Log Service or Report Issue</h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
          Record oil changes, tire replacement, or report mechanical issues to operations.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: msg.type === 'ok' ? '#ecfdf5' : '#fef2f2',
            color: msg.type === 'ok' ? '#065f46' : '#991b1b',
            border: `1px solid ${msg.type === 'ok' ? '#a7f3d0' : '#fecaca'}`
          }}
        >
          {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
          Service / Issue Type *
        </label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="field"
        >
          <option value="OIL_CHANGE">Routine Oil &amp; Filter Change</option>
          <option value="TIRES">Tire Replacement / Wheel Alignment</option>
          <option value="BRAKES">Brake Pads / Disc Servicing</option>
          <option value="ENGINE">Engine / Transmission Check</option>
          <option value="SUSPENSION">Suspension &amp; Shock Absorbers</option>
          <option value="INSURANCE_RENEWAL">Insurance Renewal</option>
          <option value="ROADWORTHY_RENEWAL">Roadworthiness Renewal</option>
          <option value="OTHER">Other Repair / Maintenance</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
            Current Mileage (km)
          </label>
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="e.g. 42000"
            className="field"
          />
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
            Cost (GHS)
          </label>
          <input
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="e.g. 350.00"
            className="field"
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
          Service Center / Garage Name
        </label>
        <input
          type="text"
          value={serviceCenter}
          onChange={(e) => setServiceCenter(e.target.value)}
          placeholder="e.g. TotalEnergies Service Station, Achimota"
          className="field"
        />
      </div>

      <div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
          Notes &amp; Details
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe repairs carried out or mechanical symptoms..."
          className="field"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Wrench size={15} />}
        {busy ? 'LOGGING...' : 'SAVE MAINTENANCE LOG'}
      </button>
    </form>
  );
}
