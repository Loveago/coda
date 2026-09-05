'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck, CalendarCheck, ChevronDown, Loader2, Pause, Play, RefreshCw, Search,
  ShieldCheck, Trash2, Users, X
} from 'lucide-react';

type Row = {
  id: string;
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  ghanaCardNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  location: string | null;
  platform: string | null;
  yearsExperience: number | null;
  vehicleInfo: string | null;
  vehicleRegistration: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelationship: string | null;
  emergency2Name: string | null;
  emergency2Phone: string | null;
  emergency2Relationship: string | null;
  status: string;
  emailVerified: boolean;
  registrationPayment: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  internalNotes: string | null;
  dues: string;
  totalPaid: number;
  lastPaidAt: string | null;
  joined: string;
};

type Counts = { all: number; paid: number; owing: number; unpaid: number; expired: number; due: number };

const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
const mediumDateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

function formatGhs(pesewas: number) {
  return `GHS ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateText(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : mediumDate.format(date);
}

function dateTimeText(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : mediumDateTime.format(date);
}

/**
 * Member roster for a free-membership agency: search, status filters and the
 * admin actions that remain (suspend/reinstate, email verification, deletion).
 * The old dues/renewal tooling was retired along with the fee system.
 */
export default function MembersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, paid: 0, owing: 0, unpaid: 0, expired: 0, due: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');

  const [busy, setBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  function toggleRow(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Debounce the search box so we don't hammer the API on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q: debounced, dues: 'all', status, sort });
      const response = await fetch(`/api/admin/members?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load members.');
      setRows(data.rows);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load members.');
    } finally {
      setLoading(false);
    }
  }, [debounced, status, sort]);

  useEffect(() => { void load(); }, [load]);

  async function act(row: Row, payload: Record<string, unknown>, successText: string) {
    setBusy(row.id);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/members/${row.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Action failed.');
      setMessage(`${row.name.split(' ')[0]}: ${successText}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="admin-dashboard-cards cards-4">
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><Users size={19} /></span>
          <strong>{counts.all}</strong>
          <span>Members{debounced ? ' matching search' : ''}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><BadgeCheck size={19} /></span>
          <strong>{counts.paid}</strong>
          <span>Active members</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><CalendarCheck size={19} /></span>
          <strong>FREE</strong>
          <span>Membership costs nothing — no registration fee, no annual dues</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><ShieldCheck size={19} /></span>
          <strong>{rows.filter((row) => row.emailVerified).length}</strong>
          <span>Email verified</span>
        </div>
      </div>

      <section className="admin-panel" style={{ marginTop: 22 }}>
        <div className="admin-toolbar">
          <div className="member-search">
            <Search size={15} />
            <input
              aria-label="Search members"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, member number or plate…"
            />
            {query && <button type="button" className="member-search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}
          </div>
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select aria-label="Sort members" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest members</option>
            <option value="oldest">Oldest members</option>
            <option value="name">Name A–Z</option>
            <option value="expiry">Expiring soonest</option>
            <option value="paid">Highest total paid</option>
          </select>
          <button type="button" className="admin-action" onClick={() => void load()} disabled={loading} aria-label="Refresh list">
            <RefreshCw size={12} className={loading ? 'spin' : undefined} /> REFRESH
          </button>
        </div>

        {error && <p role="alert" className="status-err" style={{ fontSize: 12.5 }}>{error}</p>}
        {message && <p role="status" className="status-ok" style={{ fontSize: 12.5 }}>{message}</p>}

        {loading && rows.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading members…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No members match these filters.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table card-table">
              <thead>
                <tr>
                  <th>Member</th><th>Contact</th><th>Platform</th><th>Status</th>
                  <th>Member since</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const disabled = busy === row.id;
                  const open = expanded.has(row.id);
                  return (
                    <Fragment key={row.id}>
                      <tr className={open ? 'member-row-open' : undefined}>
                        <td data-label="Member">
                          <button
                            type="button"
                            className="member-expand-btn"
                            aria-expanded={open}
                            aria-label={open ? `Hide details for ${row.name}` : `Show all registration details for ${row.name}`}
                            onClick={() => toggleRow(row.id)}
                          >
                            <ChevronDown size={14} className={open ? 'member-chevron open' : 'member-chevron'} />
                          </button>
                          <strong>{row.name}</strong>
                          <br /><small>{row.memberNumber}</small>
                          {!row.emailVerified && <span className="badge badge-DRAFT" style={{ marginLeft: 6 }}>EMAIL UNVERIFIED</span>}
                        </td>
                        <td data-label="Contact">{row.phone}<br /><small>{row.email}</small></td>
                        <td data-label="Platform">{row.platform || '—'}</td>
                        <td data-label="Status"><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                        <td data-label="Member since">{dateText(row.joined)}</td>
                        <td data-label="Actions">
                          {row.status === 'SUSPENDED' ? (
                            <button className="admin-action" disabled={disabled} onClick={() => void act(row, { action: 'REINSTATE' }, 'reinstate')}>
                              <Play size={12} /> REINSTATE
                            </button>
                          ) : (
                            <button className="admin-action" disabled={disabled} onClick={() => void act(row, { action: 'SUSPEND' }, 'suspended')}>
                              <Pause size={12} /> SUSPEND
                            </button>
                          )}
                          {!row.emailVerified && (
                            <button className="admin-action" disabled={disabled} onClick={() => void act(row, { action: 'VERIFY_EMAIL' }, 'email marked verified')}>
                              <ShieldCheck size={12} /> VERIFY
                            </button>
                          )}
                          <button className="admin-action danger" disabled={disabled} onClick={() => setDeleteTarget(row)}>
                            <Trash2 size={12} /> DELETE
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="member-detail-row">
                          <td colSpan={6}>
                            <MemberDetails row={row} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleteTarget && (
        <DeleteModal
          row={deleteTarget}
          busy={busy === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            const row = deleteTarget;
            setDeleteTarget(null);
            void act(row, { action: 'DELETE' }, 'record deleted');
          }}
        />
      )}
    </>
  );
}

/**
 * Full registration record for a member, revealed when an admin expands the
 * row. Mirrors every field collected on the sign-up form so nothing entered
 * during registration is hidden.
 */
function MemberDetails({ row }: { row: Row }) {
  return (
    <div className="member-details">
      <DetailGroup title="Personal information">
        <Detail label="Full name" value={row.name} />
        <Detail label="Member number" value={row.memberNumber} />
        <Detail label="Ghana Card number" value={row.ghanaCardNumber} />
        <Detail label="Date of birth" value={dateText(row.dateOfBirth)} />
        <Detail label="Gender" value={row.gender} />
        <Detail label="Residential location" value={row.location} />
        <Detail label="Phone" value={row.phone} />
        <Detail label="Email" value={row.email} />
        <Detail label="Email verified" value={row.emailVerified ? 'Yes' : 'No'} />
      </DetailGroup>

      <DetailGroup title="Driver information">
        <Detail label="Driving platform" value={row.platform} />
        <Detail label="Years of experience" value={row.yearsExperience === null ? null : `${row.yearsExperience} year${row.yearsExperience === 1 ? '' : 's'}`} />
        <Detail label="Vehicle information" value={row.vehicleInfo} />
        <Detail label="Vehicle registration" value={row.vehicleRegistration} />
      </DetailGroup>

      <DetailGroup title="Emergency contacts">
        <Detail label="Contact 1 · name" value={row.emergencyName} />
        <Detail label="Contact 1 · phone" value={row.emergencyPhone} />
        <Detail label="Contact 1 · relationship" value={row.emergencyRelationship} />
        <Detail label="Contact 2 · name" value={row.emergency2Name} />
        <Detail label="Contact 2 · phone" value={row.emergency2Phone} />
        <Detail label="Contact 2 · relationship" value={row.emergency2Relationship} />
      </DetailGroup>

      <DetailGroup title="Membership">
        <Detail label="Status" value={row.status} />
        <Detail label="Membership" value="Free — no fees" />
        <Detail label="Joined" value={dateTimeText(row.joined)} />
        {row.totalPaid > 0 && <Detail label="Historical payments" value={`${formatGhs(row.totalPaid)} (legacy fee era)`} />}
      </DetailGroup>

      {row.internalNotes && (
        <DetailGroup title="Internal notes">
          <p className="member-details-notes">{row.internalNotes}</p>
        </DetailGroup>
      )}
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="member-detail-group">
      <p className="member-detail-title">{title}</p>
      <dl className="member-detail-grid">{children}</dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="member-detail-item">
      <dt>{label}</dt>
      <dd className={empty ? 'is-empty' : undefined}>{empty ? '—' : value}</dd>
    </div>
  );
}

function DeleteModal({ row, busy, onClose, onConfirm }: { row: Row; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = typed.trim().toUpperCase() === row.memberNumber.toUpperCase();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Delete ${row.name}`} onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="kicker" style={{ margin: 0, color: '#c0392b' }}>DESTRUCTIVE ACTION</p>
            <h2>Delete member record</h2>
            <small style={{ color: 'var(--muted)' }}>{row.name} · {row.memberNumber} · {row.email}</small>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><X size={17} /></button>
        </div>
        <p className="admin-note" style={{ margin: 0, borderLeftColor: '#c0392b', background: '#fdeaea', color: '#7d1f14' }}>
          This permanently removes the member, their login, their payment history and their tokens. It cannot be
          undone. Consider <strong>SUSPEND</strong> instead if the member may return. A snapshot is kept in the audit log.
        </p>
        <label className="modal-label" htmlFor="delete-confirm">Type the member number to confirm</label>
        <input
          ref={inputRef}
          id="delete-confirm"
          className="field"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={row.memberNumber}
          autoComplete="off"
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>CANCEL</button>
          <button type="button" className="btn btn-primary" style={{ background: 'linear-gradient(110deg,#c0392b,#8f1f14)', boxShadow: '0 8px 20px rgba(192,57,43,.3)' }} disabled={busy || !ready} onClick={onConfirm}>
            {busy ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} DELETE PERMANENTLY
          </button>
        </div>
      </div>
    </div>
  );
}
