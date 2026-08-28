'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, BadgeCheck, CalendarClock, CheckCircle2, CircleDollarSign, Loader2,
  Pause, Play, RefreshCw, Search, ShieldCheck, Trash2, Users, X
} from 'lucide-react';

type DuesState = 'PAID' | 'DUE_SOON' | 'EXPIRED' | 'UNPAID';

type Row = {
  id: string;
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  platform: string | null;
  status: string;
  emailVerified: boolean;
  registrationPayment: string;
  membershipEndDate: string | null;
  dues: DuesState;
  totalPaid: number;
  lastPaidAt: string | null;
  joined: string;
};

type Counts = { all: number; paid: number; owing: number; unpaid: number; expired: number; due: number };

const duesFilters: [string, string][] = [
  ['all', 'All members'],
  ['paid', 'Paid up'],
  ['owing', 'Owing'],
  ['unpaid', 'Never paid'],
  ['expired', 'Expired'],
  ['due', 'Due soon']
];

const duesBadge: Record<DuesState, { label: string; className: string }> = {
  PAID: { label: 'PAID UP', className: 'badge badge-PUBLISHED' },
  DUE_SOON: { label: 'DUE SOON', className: 'badge badge-PENDING' },
  EXPIRED: { label: 'EXPIRED', className: 'badge badge-REJECTED' },
  UNPAID: { label: 'DUES UNPAID', className: 'badge badge-REJECTED' }
};

const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function formatGhs(pesewas: number) {
  return `GHS ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateText(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : mediumDate.format(date);
}

export default function MembersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, paid: 0, owing: 0, unpaid: 0, expired: 0, due: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [dues, setDues] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');

  const [busy, setBusy] = useState<string | null>(null);
  const [renewTarget, setRenewTarget] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  // Debounce the search box so we don't hammer the API on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q: debounced, dues, status, sort });
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
  }, [debounced, dues, status, sort]);

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

  const revenue = useMemo(() => rows.reduce((sum, row) => sum + row.totalPaid, 0), [rows]);

  return (
    <>
      <div className="admin-dashboard-cards cards-4">
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><Users size={19} /></span>
          <strong>{counts.all}</strong>
          <span>Members{debounced ? ' matching search' : ''}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><CheckCircle2 size={19} /></span>
          <strong>{counts.paid}</strong>
          <span>Paid up</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><AlertTriangle size={19} /></span>
          <strong>{counts.owing}</strong>
          <span>Owing dues · {counts.unpaid} never paid · {counts.expired} expired · {counts.due} due soon</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon"><CircleDollarSign size={19} /></span>
          <strong>{formatGhs(revenue)}</strong>
          <span>Collected from listed members</span>
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

        <div className="payfilters" role="group" aria-label="Filter by dues">
          {duesFilters.map(([value, label]) => (
            <button key={value} type="button" className={`payfilter${dues === value ? ' on' : ''}`} onClick={() => setDues(value)}>
              {label} <span className="payfilter-count">{counts[value as keyof Counts]}</span>
            </button>
          ))}
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
                  <th>Member</th><th>Contact</th><th>Platform</th><th>Status</th><th>Dues</th>
                  <th>Valid until</th><th>Total paid</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const badge = duesBadge[row.dues];
                  const disabled = busy === row.id;
                  return (
                    <tr key={row.id}>
                      <td data-label="Member">
                        <strong>{row.name}</strong>
                        <br /><small>{row.memberNumber}</small>
                        {!row.emailVerified && <span className="badge badge-DRAFT" style={{ marginLeft: 6 }}>EMAIL UNVERIFIED</span>}
                      </td>
                      <td data-label="Contact">{row.phone}<br /><small>{row.email}</small></td>
                      <td data-label="Platform">{row.platform || '—'}</td>
                      <td data-label="Status"><span className={`badge badge-${row.status}`}>{row.status}</span></td>
                      <td data-label="Dues"><span className={badge.className}>{badge.label}</span></td>
                      <td data-label="Valid until">{dateText(row.membershipEndDate)}</td>
                      <td data-label="Total paid"><strong>{formatGhs(row.totalPaid)}</strong>{row.lastPaidAt && <small><br />last {dateText(row.lastPaidAt)}</small>}</td>
                      <td data-label="Joined">{dateText(row.joined)}</td>
                      <td data-label="Actions">
                        <button className="admin-action" disabled={disabled} onClick={() => setRenewTarget(row)}>
                          <CalendarClock size={12} /> RENEW
                        </button>
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
                        {row.registrationPayment === 'PENDING' && (
                          <button className="admin-action" disabled={disabled} onClick={() => void act(row, { action: 'MARK_REGISTRATION_PAID' }, 'registration fee marked paid')}>
                            <BadgeCheck size={12} /> FEE PAID
                          </button>
                        )}
                        <button className="admin-action danger" disabled={disabled} onClick={() => setDeleteTarget(row)}>
                          <Trash2 size={12} /> DELETE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {renewTarget && (
        <RenewModal
          row={renewTarget}
          busy={busy === renewTarget.id}
          onClose={() => setRenewTarget(null)}
          onConfirm={(months, note) => {
            setRenewTarget(null);
            void act(renewTarget, { action: 'RENEW', months, note: note || undefined }, `membership renewed for ${months} month${months === 1 ? '' : 's'}`);
          }}
        />
      )}

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

function RenewModal({ row, busy, onClose, onConfirm }: { row: Row; busy: boolean; onClose: () => void; onConfirm: (months: number, note: string) => void }) {
  const [months, setMonths] = useState(12);
  const [note, setNote] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Renew ${row.name}`} onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="kicker" style={{ margin: 0 }}>MANUAL RENEWAL</p>
            <h2>{row.name}</h2>
            <small style={{ color: 'var(--muted)' }}>{row.memberNumber} · current validity: {dateText(row.membershipEndDate)}</small>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><X size={17} /></button>
        </div>
        <p className="admin-note" style={{ margin: '0 0 16px' }}>
          Records an off-platform annual-dues payment (cash, mobile money or bank transfer) and extends the
          membership year. The payment appears in the member&rsquo;s history and in finance analytics as manual.
        </p>
        <label className="modal-label" htmlFor="renew-months">Renew for</label>
        <select id="renew-months" className="field" value={months} onChange={(event) => setMonths(Number(event.target.value))}>
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={12}>12 months (full year)</option>
          <option value={24}>24 months</option>
        </select>
        <label className="modal-label" htmlFor="renew-note">Note (optional)</label>
        <input id="renew-note" className="field" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Paid cash at headquarters meeting" />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>CANCEL</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onConfirm(months, note.trim())}>
            {busy ? <Loader2 size={15} className="spin" /> : <CalendarClock size={15} />} CONFIRM RENEWAL
          </button>
        </div>
      </div>
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
