'use client';

import { useState } from 'react';

type ManagementRecord = {
  id: string;
  [key: string]: unknown;
};

type Props = {
  resource: string;
  records: ManagementRecord[];
};

const labels: Record<string, string> = {
  members: 'Membership applications',
  messages: 'Contact messages',
  subscribers: 'Newsletter subscribers',
  statistics: 'Homepage statistics',
  settings: 'Site settings',
  gallery: 'Gallery items',
  resources: 'Resources',
  team: 'Team members'
};

function dateValue(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.valueOf()) ? String(value) : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
}

const exportable = new Set(['members', 'subscribers', 'messages']);
const deletable = new Set(['members', 'messages', 'subscribers', 'statistics', 'gallery', 'resources', 'team']);

export default function AdminManagementTable({ resource, records: initialRecords }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function remove(id: string) {
    if (!window.confirm('Delete this record permanently? This cannot be undone.')) return;
    setBusy(id);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/management/${resource}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Delete failed.');
      setRecords((current: ManagementRecord[]) => current.filter((record: ManagementRecord) => record.id !== id));
      setMessage('Record deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete record.');
    } finally {
      setBusy(null);
    }
  }

  async function update(id: string, data: Record<string, unknown>) {
    setBusy(id);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/management/${resource}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed.');
      setRecords((current: ManagementRecord[]) => current.map((record: ManagementRecord) => record.id === id ? { ...record, ...result } : record));
      setMessage('Changes saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="admin-panel" style={{ maxWidth: 'none', overflowX: 'auto' }}>
      <div className="section-head">
        <h2>{labels[resource] || 'Management records'}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {message && <p role="status" className="status-ok" style={{ fontSize: 12, margin: 0 }}>{message}</p>}
          {exportable.has(resource) && <a className="admin-action" href={`/api/admin/export/${resource}`}>EXPORT CSV</a>}
        </div>
      </div>
      {records.length === 0 ? <p>No records found.</p> : (
        <table className="admin-table">
          <thead><tr>
            {resource === 'members' && <><th>Name</th><th>Contact</th><th>Region</th><th>Status</th><th>Submitted</th><th>Action</th></>}
            {resource === 'messages' && <><th>Sender</th><th>Subject</th><th>Message</th><th>State</th><th>Received</th><th>Action</th></>}
            {resource === 'subscribers' && <><th>Email</th><th>State</th><th>Joined</th><th>Action</th></>}
            {resource === 'statistics' && <><th>Label</th><th>Value</th><th>Order</th><th>State</th><th>Action</th></>}
            {resource === 'settings' && <><th>Key</th><th>Value</th><th>Updated</th><th>Action</th></>}
            {resource === 'gallery' && <><th>Title</th><th>Category</th><th>Featured</th><th>Image URL</th></>}
            {resource === 'resources' && <><th>Title</th><th>Category</th><th>Published</th><th>File</th></>}
            {resource === 'team' && <><th>Name</th><th>Position</th><th>Order</th><th>State</th></>}
          </tr></thead>
          <tbody>{records.map((record) => {
            const id = record.id;
            const deleteButton = deletable.has(resource) ? <button className="admin-action danger" disabled={busy === id} onClick={() => remove(id)}>DELETE</button> : null;
            if (resource === 'members') return <tr key={id}><td><strong>{String(record.fullName)}</strong></td><td>{String(record.phone)}<br />{String(record.email || '')}</td><td>{String(record.region || '—')}</td><td><span className={`badge badge-${String(record.status)}`}>{String(record.status)}</span></td><td>{dateValue(record.createdAt)}</td><td><select value={String(record.status)} disabled={busy === id} onChange={(event) => update(id, { status: event.target.value })}><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>SUSPENDED</option></select>{deleteButton}</td></tr>;
            if (resource === 'messages') return <tr key={id}><td><strong>{String(record.name)}</strong><br />{String(record.email)}</td><td>{String(record.subject)}</td><td className="admin-message-cell">{String(record.message)}</td><td><span className={`badge ${record.archived ? 'badge-ARCHIVED' : record.read ? 'badge-active' : 'badge-PENDING'}`}>{record.archived ? 'ARCHIVED' : record.read ? 'READ' : 'UNREAD'}</span></td><td>{dateValue(record.createdAt)}</td><td><button className="admin-action" disabled={busy === id} onClick={() => update(id, { read: !record.read })}>{record.read ? 'MARK UNREAD' : 'MARK READ'}</button><button className="admin-action" disabled={busy === id} onClick={() => update(id, { archived: !record.archived })}>{record.archived ? 'RESTORE' : 'ARCHIVE'}</button>{deleteButton}</td></tr>;
            if (resource === 'subscribers') return <tr key={id}><td>{String(record.email)}</td><td><span className={`badge ${record.active ? 'badge-active' : 'badge-INACTIVE'}`}>{record.active ? 'ACTIVE' : 'REMOVED'}</span></td><td>{dateValue(record.createdAt)}</td><td><button className="admin-action" disabled={busy === id} onClick={() => update(id, { active: !record.active })}>{record.active ? 'DEACTIVATE' : 'ACTIVATE'}</button>{deleteButton}</td></tr>;
            if (resource === 'statistics') return <tr key={id}><td><strong>{String(record.label)}</strong></td><td>{String(record.value)}</td><td>{String(record.displayOrder)}</td><td><span className={`badge ${record.active ? 'badge-active' : 'badge-INACTIVE'}`}>{record.active ? 'ACTIVE' : 'HIDDEN'}</span></td><td><button className="admin-action" disabled={busy === id} onClick={() => update(id, { label: record.label, value: record.value, description: record.description, displayOrder: record.displayOrder, active: !record.active })}>{record.active ? 'HIDE' : 'SHOW'}</button>{deleteButton}</td></tr>;
            if (resource === 'settings') return <tr key={id}><td>{String(record.key)}</td><td>{String(record.value)}</td><td>{dateValue(record.updatedAt)}</td><td><button className="admin-action" onClick={() => { const value = window.prompt(`Value for ${String(record.key)}`, String(record.value)); if (value !== null) update(id, { key: record.key, value }); }}>EDIT</button></td></tr>;
            if (resource === 'gallery') return <tr key={id}><td>{String(record.title)}</td><td>{String(record.category || '—')}</td><td>{record.featured ? 'Yes' : 'No'}</td><td><a href={String(record.imageUrl)} target="_blank" rel="noreferrer" className="admin-link">OPEN</a></td></tr>;
            if (resource === 'resources') return <tr key={id}><td>{String(record.title)}</td><td>{String(record.category)}</td><td>{record.published ? 'Yes' : 'No'}</td><td><a href={String(record.fileUrl)} target="_blank" rel="noreferrer" className="admin-link">OPEN</a></td></tr>;
            return <tr key={id}><td>{String(record.name)}</td><td>{String(record.position)}</td><td>{String(record.displayOrder)}</td><td>{record.active ? 'Active' : 'Hidden'}</td></tr>;
          })}</tbody>
        </table>
      )}
    </section>
  );
}
