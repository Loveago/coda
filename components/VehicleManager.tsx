'use client';

import { useMemo, useState } from 'react';
import { CarFront, Check, Loader2, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react';
import ImageUploadField from '@/components/ImageUploadField';

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  transmission: string | null;
  fuelType: string | null;
  seats: number | null;
  description: string | null;
  features: unknown;
  price: number | null;
  dailyRate: number | null;
  availability: string;
  featured: boolean;
  createdAt: string;
  images?: { url: string; position: number }[];
};

const field = { padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 9, background: '#fff', fontSize: 12.5, width: '100%' };
const label = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };

const categories = ['SUV', 'Sedan', 'Hatchback', 'Pickup', 'Van', 'Bus/Minibus', 'Economy', 'Luxury', 'Truck'];
const transmissions = ['Automatic', 'Manual', 'CVT'];
const fuels = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'];
const availabilityStates = ['AVAILABLE', 'RESERVED', 'RENTED', 'SOLD'];

const suggestedFeatures = ['Air Conditioning', 'Power Steering', 'Power Windows', 'Central Locking', 'Bluetooth', 'Reverse Camera', 'Alloy Wheels', 'Cruise Control', 'Leather Seats', 'Sunroof', 'Android Auto', 'Apple CarPlay'];

function ghs(pesewas: number | null) {
  return pesewas === null ? '—' : `GHS ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

function featureList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function VehicleManager({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // ===== Add form =====
  const [form, setForm] = useState({ make: '', model: '', year: String(new Date().getFullYear()), category: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', seats: '5', price: '', dailyRate: '', description: '', availability: 'AVAILABLE', featured: false });
  const [features, setFeatures] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // ===== Edit modal =====
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({});
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (statusFilter && vehicle.availability !== statusFilter) return false;
      if (!needle) return true;
      return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.category}`.toLowerCase().includes(needle);
    });
  }, [vehicles, query, statusFilter]);

  const soldCount = vehicles.filter((vehicle) => vehicle.availability === 'SOLD').length;
  const inventoryValue = vehicles.filter((vehicle) => vehicle.availability !== 'SOLD').reduce((sum, vehicle) => sum + (vehicle.price ?? 0), 0);

  function set<K extends keyof typeof form>(key: K, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/management/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: Number(form.year),
          category: form.category,
          transmission: form.transmission,
          fuelType: form.fuelType,
          seats: Number(form.seats) || undefined,
          description: form.description || undefined,
          price: form.price ? Math.round(Number(form.price) * 100) : undefined,
          dailyRate: form.dailyRate ? Math.round(Number(form.dailyRate) * 100) : undefined,
          availability: form.availability,
          featured: form.featured,
          features,
          images
        })
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not save the vehicle.');
      setVehicles((current) => [created, ...current]);
      setForm({ make: '', model: '', year: String(new Date().getFullYear()), category: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', seats: '5', price: '', dailyRate: '', description: '', availability: 'AVAILABLE', featured: false });
      setFeatures([]);
      setImages([]);
      setShowForm(false);
      setMessage({ ok: true, text: `${created.year} ${created.make} ${created.model} added to inventory.` });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Could not save the vehicle.' });
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(id);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/management/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed.');
      setVehicles((current) => current.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...result } : vehicle)));
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Update failed.' });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this vehicle permanently? Its images and enquiries will also be removed.')) return;
    setBusy(id);
    try {
      const response = await fetch('/api/admin/management/vehicles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error('Delete failed.');
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
      setMessage({ ok: true, text: 'Vehicle deleted.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Delete failed.' });
    } finally {
      setBusy(null);
    }
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setEditDraft({
      make: vehicle.make, model: vehicle.model, year: vehicle.year, category: vehicle.category,
      transmission: vehicle.transmission ?? '', fuelType: vehicle.fuelType ?? '', seats: vehicle.seats ?? '',
      // Store prices as GHS strings in the draft — saveEdit converts back to pesewas.
      price: vehicle.price === null ? '' : (vehicle.price / 100).toFixed(2),
      dailyRate: vehicle.dailyRate === null ? '' : (vehicle.dailyRate / 100).toFixed(2),
      description: vehicle.description ?? '',
      availability: vehicle.availability, featured: vehicle.featured
    });
    setEditFeatures(featureList(vehicle.features));
    setEditImages((vehicle.images ?? []).map((image) => image.url));
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(editing.id);
    try {
      const parseMoney = (value: unknown) => value === '' || value === null || value === undefined || Number.isNaN(Number(value)) ? null : Math.round(Number(value) * 100);
      const response = await fetch('/api/admin/management/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          make: editDraft.make, model: editDraft.model, year: Number(editDraft.year), category: editDraft.category,
          transmission: editDraft.transmission, fuelType: editDraft.fuelType, seats: Number(editDraft.seats) || undefined,
          description: editDraft.description, features: editFeatures,
          price: parseMoney(editDraft.price), dailyRate: parseMoney(editDraft.dailyRate),
          availability: editDraft.availability, featured: editDraft.featured
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed.');
      setVehicles((current) => current.map((vehicle) => (vehicle.id === editing.id ? { ...vehicle, ...result } : vehicle)));
      setEditing(null);
      setMessage({ ok: true, text: 'Vehicle updated.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Update failed.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section style={{ display: 'grid', gap: 22 }}>
      <div className="admin-dashboard-cards cards-4">
        <div className="admin-stat-card"><strong>{vehicles.length}</strong><span>Total vehicles</span></div>
        <div className="admin-stat-card"><strong>{vehicles.filter((v) => v.availability === 'AVAILABLE').length}</strong><span>Available now</span></div>
        <div className="admin-stat-card"><strong>{soldCount}</strong><span>Sold</span></div>
        <div className="admin-stat-card"><strong>{ghs(inventoryValue)}</strong><span>Inventory value</span></div>
      </div>

      {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ margin: 0 }}>{message.text}</p>}

      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Inventory ({filtered.length})</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--muted)' }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search make, model…" style={{ ...field, width: 200, paddingLeft: 30 }} aria-label="Search vehicles" />
            </span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ ...field, width: 150 }} aria-label="Filter by availability">
              <option value="">All statuses</option>
              {availabilityStates.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
            <button type="button" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={() => setShowForm((current) => !current)}>
              <Plus size={15} /> {showForm ? 'CLOSE FORM' : 'ADD VEHICLE'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={create} style={{ display: 'grid', gap: 14, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div><label style={label}>MAKE *</label><input value={form.make} onChange={(event) => set('make', event.target.value)} required placeholder="Toyota" style={field} /></div>
              <div><label style={label}>MODEL *</label><input value={form.model} onChange={(event) => set('model', event.target.value)} required placeholder="Corolla" style={field} /></div>
              <div><label style={label}>YEAR *</label><input value={form.year} onChange={(event) => set('year', event.target.value)} type="number" min={1950} max={2100} required style={field} /></div>
              <div>
                <label style={label}>CATEGORY *</label>
                <select value={form.category} onChange={(event) => set('category', event.target.value)} style={field}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label style={label}>TRANSMISSION</label>
                <select value={form.transmission} onChange={(event) => set('transmission', event.target.value)} style={field}>{transmissions.map((t) => <option key={t}>{t}</option>)}</select>
              </div>
              <div>
                <label style={label}>FUEL TYPE</label>
                <select value={form.fuelType} onChange={(event) => set('fuelType', event.target.value)} style={field}>{fuels.map((f) => <option key={f}>{f}</option>)}</select>
              </div>
              <div><label style={label}>SEATS</label><input value={form.seats} onChange={(event) => set('seats', event.target.value)} type="number" min={1} max={60} style={field} /></div>
              <div><label style={label}>SALE PRICE (GHS)</label><input value={form.price} onChange={(event) => set('price', event.target.value)} type="number" step="0.01" min={0} placeholder="For sale" style={field} /></div>
              <div><label style={label}>DAILY RATE (GHS)</label><input value={form.dailyRate} onChange={(event) => set('dailyRate', event.target.value)} type="number" step="0.01" min={0} placeholder="For rentals" style={field} /></div>
              <div>
                <label style={label}>AVAILABILITY</label>
                <select value={form.availability} onChange={(event) => set('availability', event.target.value)} style={field}>{availabilityStates.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
            </div>

            <div>
              <label style={label}>FEATURES</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {suggestedFeatures.map((feature) => {
                  const on = features.includes(feature);
                  return (
                    <button key={feature} type="button" className={`admin-action${on ? ' on' : ''}`} style={{ fontSize: 10.5, background: on ? 'var(--accent)' : undefined, color: on ? '#fff' : undefined, borderColor: on ? 'transparent' : undefined }}
                      onClick={() => setFeatures((current) => on ? current.filter((item) => item !== feature) : [...current, feature])}>
                      {on ? <Check size={10} /> : <Plus size={10} />} {feature}
                    </button>
                  );
                })}
              </div>
            </div>

            <ImageUploadField urls={images} onChange={setImages} max={8} label="Vehicle photos" hint="First photo becomes the cover · up to 8" />

            <div>
              <label style={label}>DESCRIPTION</label>
              <textarea value={form.description} onChange={(event) => set('description', event.target.value)} rows={2} placeholder="Condition, mileage, service history…" style={{ ...field, resize: 'vertical' }} />
            </div>

            <label style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.featured} onChange={(event) => set('featured', event.target.checked)} />
              <Star size={13} style={{ color: 'var(--accent)' }} /> Feature on the homepage
            </label>

            <button className="btn btn-primary" disabled={saving} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {saving ? <Loader2 size={15} className="spin" /> : <CarFront size={15} />} {saving ? 'SAVING...' : 'ADD TO INVENTORY'}
            </button>
          </form>
        )}

        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{vehicles.length === 0 ? 'No vehicles yet — add your first listing.' : 'No vehicles match your filters.'}</p>
          ) : (
            <table className="admin-table card-table">
              <thead><tr><th>Vehicle</th><th>Category</th><th>Price / Rate</th><th>Availability</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td data-label="Vehicle">
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {vehicle.images?.[0]
                          ? <img src={vehicle.images[0].url} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--line)' }} />
                          : <span style={{ width: 64, height: 44, borderRadius: 7, background: '#F1F1F1', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}><CarFront size={17} /></span>}
                        <span><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>{vehicle.featured ? ' ★' : ''}<br /><small style={{ color: 'var(--muted)' }}>{vehicle.transmission || '—'} · {vehicle.fuelType || '—'} · {vehicle.seats || '—'} seats</small></span>
                      </div>
                    </td>
                    <td data-label="Category">{vehicle.category}</td>
                    <td data-label="Price">{vehicle.price ? ghs(vehicle.price) : '—'}{vehicle.dailyRate ? <><br /><small>{ghs(vehicle.dailyRate)}/day</small></> : null}</td>
                    <td data-label="Availability">
                      <span className={`badge ${vehicle.availability === 'AVAILABLE' ? 'badge-active' : vehicle.availability === 'SOLD' ? 'badge-REJECTED' : 'badge-PENDING'}`}>{vehicle.availability}</span>
                    </td>
                    <td data-label="Actions">
                      {availabilityStates.filter((state) => state !== vehicle.availability).slice(0, 2).map((state) => (
                        <button key={state} type="button" className="admin-action" disabled={busy === vehicle.id} onClick={() => patch(vehicle.id, { availability: state })}>{state}</button>
                      ))}
                      <button type="button" className="admin-action" disabled={busy === vehicle.id} onClick={() => patch(vehicle.id, { featured: !vehicle.featured })}>{vehicle.featured ? 'UNFEATURE' : 'FEATURE'}</button>
                      <button type="button" className="admin-action" disabled={busy === vehicle.id} onClick={() => openEdit(vehicle)}><Pencil size={11} /> EDIT</button>
                      <button type="button" className="admin-action danger" disabled={busy === vehicle.id} onClick={() => remove(vehicle.id)}><Trash2 size={11} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== Edit modal ===== */}
      {editing && (
        <div role="dialog" aria-modal="true" aria-label={`Edit ${editing.make} ${editing.model}`} onClick={(event) => { if (event.target === event.currentTarget) setEditing(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,.55)', zIndex: 120, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="admin-panel" style={{ width: 'min(680px, 100%)', maxHeight: '88vh', overflowY: 'auto' }}>
            <h2>Edit vehicle</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div><label style={label}>MAKE</label><input value={String(editDraft.make ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, make: event.target.value }))} style={field} /></div>
                <div><label style={label}>MODEL</label><input value={String(editDraft.model ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, model: event.target.value }))} style={field} /></div>
                <div><label style={label}>YEAR</label><input type="number" value={String(editDraft.year ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, year: event.target.value }))} style={field} /></div>
                <div>
                  <label style={label}>CATEGORY</label>
                  <select value={String(editDraft.category ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, category: event.target.value }))} style={field}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label style={label}>TRANSMISSION</label>
                  <select value={String(editDraft.transmission ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, transmission: event.target.value }))} style={field}>{transmissions.map((t) => <option key={t}>{t}</option>)}</select>
                </div>
                <div>
                  <label style={label}>FUEL</label>
                  <select value={String(editDraft.fuelType ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, fuelType: event.target.value }))} style={field}>{fuels.map((f) => <option key={f}>{f}</option>)}</select>
                </div>
                <div><label style={label}>SEATS</label><input type="number" value={String(editDraft.seats ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, seats: event.target.value }))} style={field} /></div>
                <div><label style={label}>SALE PRICE (GHS)</label><input type="number" step="0.01" value={String(editDraft.price ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, price: event.target.value }))} style={field} /></div>
                <div><label style={label}>DAILY RATE (GHS)</label><input type="number" step="0.01" value={String(editDraft.dailyRate ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, dailyRate: event.target.value }))} style={field} /></div>
                <div>
                  <label style={label}>AVAILABILITY</label>
                  <select value={String(editDraft.availability ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, availability: event.target.value }))} style={field}>{availabilityStates.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
              </div>
              <div>
                <label style={label}>FEATURES</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {suggestedFeatures.map((feature) => {
                    const on = editFeatures.includes(feature);
                    return (
                      <button key={feature} type="button" className="admin-action" style={{ fontSize: 10.5, background: on ? 'var(--accent)' : undefined, color: on ? '#fff' : undefined, borderColor: on ? 'transparent' : undefined }}
                        onClick={() => setEditFeatures((current) => on ? current.filter((item) => item !== feature) : [...current, feature])}>
                        {on ? <X size={10} /> : <Plus size={10} />} {feature}
                      </button>
                    );
                  })}
                </div>
              </div>
              <ImageUploadField urls={editImages} onChange={setEditImages} max={8} label="Vehicle photos" hint="First photo becomes the cover · up to 8" />
              <div>
                <label style={label}>DESCRIPTION</label>
                <textarea rows={2} value={String(editDraft.description ?? '')} onChange={(event) => setEditDraft((d) => ({ ...d, description: event.target.value }))} style={{ ...field, resize: 'vertical' }} />
              </div>
              <label style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={Boolean(editDraft.featured)} onChange={(event) => setEditDraft((d) => ({ ...d, featured: event.target.checked }))} />
                <Star size={13} style={{ color: 'var(--accent)' }} /> Featured on homepage
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>CANCEL</button>
                <button type="button" className="btn btn-primary" disabled={busy === editing.id} onClick={saveEdit}>{busy === editing.id ? 'SAVING...' : 'SAVE CHANGES'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
