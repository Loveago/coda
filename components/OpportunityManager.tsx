'use client';

import { useState } from 'react';
import { Briefcase, Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

type Opportunity = {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: unknown;
  benefits: unknown;
  status: string;
  createdAt: string;
  _count?: { applications: number };
};

const field = { padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 9, background: '#fff', fontSize: 12.5, width: '100%' };
const label = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };
const statuses = ['OPEN', 'CLOSED', 'ARCHIVED'] as const;

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Admin editor for the job postings members can apply to from their dashboard.
 * Postings with applications cannot be deleted (only closed) so the recruitment
 * audit trail stays intact.
 */
export default function OpportunityManager({ initialOpportunities }: { initialOpportunities: Opportunity[] }) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: 'OPEN' });
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [draftItem, setDraftItem] = useState('');
  const [draftTarget, setDraftTarget] = useState<'requirements' | 'benefits'>('requirements');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/management/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: slugify(form.title),
          description: form.description,
          requirements,
          benefits,
          status: form.status
        })
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not publish the opportunity.');
      setOpportunities((current) => [{ ...created, _count: { applications: 0 } }, ...current]);
      setForm({ title: '', description: '', status: 'OPEN' });
      setRequirements([]);
      setBenefits([]);
      setShowForm(false);
      setMessage({ ok: true, text: `"${created.title}" is now live for members.` });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Could not publish the opportunity.' });
    } finally {
      setSaving(false);
    }
  }

  function addDraft() {
    const value = draftItem.trim();
    if (!value) return;
    if (draftTarget === 'requirements') setRequirements((current) => [...current, value]);
    else setBenefits((current) => [...current, value]);
    setDraftItem('');
  }

  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(id);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/management/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed.');
      setOpportunities((current) => current.map((opportunity) => (opportunity.id === id ? { ...opportunity, ...result } : opportunity)));
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Update failed.' });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this job posting?')) return;
    setBusy(id);
    try {
      const response = await fetch('/api/admin/management/opportunities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Delete failed.');
      setOpportunities((current) => current.filter((opportunity) => opportunity.id !== id));
      setMessage({ ok: true, text: 'Posting deleted.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Delete failed.' });
    } finally {
      setBusy(null);
    }
  }

  const chips = (items: string[], onRemove: (index: number) => void) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF3E8', color: '#C65300', borderRadius: 999, padding: '4px 10px', fontSize: 11.5, fontWeight: 600 }}>
          {item}
          <button type="button" aria-label={`Remove ${item}`} onClick={() => onRemove(index)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center', color: 'inherit' }}><X size={11} /></button>
        </span>
      ))}
    </div>
  );

  const draftInput = (
    <div style={{ display: 'flex', gap: 8 }}>
      <select value={draftTarget} onChange={(event) => setDraftTarget(event.target.value as 'requirements' | 'benefits')} style={{ ...field, width: 150 }} aria-label="List to add to">
        <option value="requirements">Requirement</option>
        <option value="benefits">Benefit</option>
      </select>
      <input value={draftItem} onChange={(event) => setDraftItem(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addDraft(); } }} placeholder="Type and press Add…" style={field} />
      <button type="button" className="admin-action" onClick={addDraft}><Plus size={12} /> ADD</button>
    </div>
  );

  return (
    <section style={{ display: 'grid', gap: 22 }}>
      {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ margin: 0 }}>{message.text}</p>}

      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Job postings ({opportunities.length})</h2>
          <button type="button" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={() => setShowForm((current) => !current)}>
            <Plus size={15} /> {showForm ? 'CLOSE FORM' : 'ADD POSTING'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={create} style={{ display: 'grid', gap: 14, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div><label style={label}>JOB TITLE *</label><input value={form.title} onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))} required minLength={3} placeholder="e.g. Fleet Driver — Accra" style={field} /></div>
              <div>
                <label style={label}>STATUS</label>
                <select value={form.status} onChange={(event) => setForm((c) => ({ ...c, status: event.target.value }))} style={field}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
            </div>
            <div><label style={label}>DESCRIPTION *</label><textarea value={form.description} onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))} required rows={2} placeholder="What the role involves, territory, pay structure…" style={{ ...field, resize: 'vertical' }} /></div>
            <div>
              <label style={label}>REQUIREMENTS & BENEFITS</label>
              {draftInput}
              <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                <div><small style={{ color: 'var(--muted)', fontWeight: 700 }}>REQUIREMENTS</small>{chips(requirements, (index) => setRequirements((current) => current.filter((_, i) => i !== index)))}</div>
                <div><small style={{ color: 'var(--muted)', fontWeight: 700 }}>BENEFITS</small>{chips(benefits, (index) => setBenefits((current) => current.filter((_, i) => i !== index)))}</div>
              </div>
            </div>
            <button className="btn btn-primary" disabled={saving} style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {saving ? <Loader2 size={15} className="spin" /> : <Briefcase size={15} />} {saving ? 'PUBLISHING...' : 'PUBLISH POSTING'}
            </button>
          </form>
        )}

        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          {opportunities.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No job postings yet — publish the first one so members have roles to apply for.</p>
          ) : (
            <table className="admin-table card-table">
              <thead><tr><th>Posting</th><th>Requirements</th><th>Applications</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td data-label="Posting"><strong>{opportunity.title}</strong><br /><small style={{ color: 'var(--muted)' }}>{opportunity.description.slice(0, 80)}{opportunity.description.length > 80 ? '…' : ''}</small></td>
                    <td data-label="Requirements"><small>{list(opportunity.requirements).slice(0, 2).join(' · ') || '—'}</small></td>
                    <td data-label="Applications">{opportunity._count?.applications ?? 0}</td>
                    <td data-label="Status"><span className={`badge ${opportunity.status === 'OPEN' ? 'badge-active' : opportunity.status === 'CLOSED' ? 'badge-PENDING' : 'badge-ARCHIVED'}`}>{opportunity.status}</span></td>
                    <td data-label="Actions">
                      {statuses.filter((state) => state !== opportunity.status).slice(0, 2).map((state) => (
                        <button key={state} type="button" className="admin-action" disabled={busy === opportunity.id} onClick={() => patch(opportunity.id, { status: state })}>{state}</button>
                      ))}
                      <button type="button" className="admin-action" disabled={busy === opportunity.id} onClick={() => { setEditing(opportunity); setRequirements(list(opportunity.requirements)); setBenefits(list(opportunity.benefits)); }}><Pencil size={11} /> EDIT</button>
                      <button type="button" className="admin-action danger" disabled={busy === opportunity.id} onClick={() => remove(opportunity.id)}><Trash2 size={11} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <div role="dialog" aria-modal="true" aria-label={`Edit ${editing.title}`} onClick={(event) => { if (event.target === event.currentTarget) setEditing(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,.55)', zIndex: 120, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="admin-panel" style={{ width: 'min(620px, 100%)', maxHeight: '88vh', overflowY: 'auto' }}>
            <h2>Edit posting</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={label}>TITLE</label><input value={editing.title} onChange={(event) => setEditing((c) => c && { ...c, title: event.target.value })} style={field} /></div>
              <div><label style={label}>DESCRIPTION</label><textarea rows={3} value={editing.description} onChange={(event) => setEditing((c) => c && { ...c, description: event.target.value })} style={{ ...field, resize: 'vertical' }} /></div>
              <div>
                <label style={label}>REQUIREMENTS & BENEFITS</label>
                {draftInput}
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  <div><small style={{ color: 'var(--muted)', fontWeight: 700 }}>REQUIREMENTS</small>{chips(requirements, (index) => setRequirements((current) => current.filter((_, i) => i !== index)))}</div>
                  <div><small style={{ color: 'var(--muted)', fontWeight: 700 }}>BENEFITS</small>{chips(benefits, (index) => setBenefits((current) => current.filter((_, i) => i !== index)))}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>CANCEL</button>
                <button type="button" className="btn btn-primary" disabled={busy === editing.id} onClick={async () => {
                  await patch(editing.id, { title: editing.title, slug: slugify(editing.title), description: editing.description, requirements, benefits });
                  setEditing(null);
                  setMessage({ ok: true, text: 'Posting updated.' });
                }}>
                  <Check size={15} /> SAVE CHANGES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
