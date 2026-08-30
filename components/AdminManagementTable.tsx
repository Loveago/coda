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
  applications: 'Membership applications',
  members: 'Members',
  messages: 'Contact messages',
  subscribers: 'Newsletter subscribers',
  statistics: 'Homepage statistics',
  settings: 'Site settings',
  gallery: 'Gallery items',
  resources: 'Resources',
  team: 'Team members',
  services: 'Agency services',
  vehicles: 'Vehicle inventory',
  rentals: 'Rental enquiries',
  products: 'Automotive goods',
  recruitment: 'Driver applications'
};

function dateValue(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.valueOf()) ? String(value) : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
}

const exportable = new Set(['applications', 'members', 'subscribers', 'messages']);
const deletable = new Set(['messages', 'subscribers', 'statistics', 'gallery', 'resources', 'team', 'services', 'vehicles', 'rentals', 'products']);

const rentalStatuses = ['NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED'] as const;
const driverStatuses = ['NEW', 'REVIEWING', 'HIRED', 'DECLINED'] as const;
const vehicleAvailability = ['AVAILABLE', 'RESERVED', 'RENTED', 'SOLD'] as const;

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
        <table className="admin-table card-table">
          <thead><tr>
            {resource === 'applications' && <><th>Name</th><th>Contact</th><th>Platform</th><th>Fee</th><th>Submitted</th><th>Action</th></>}
            {resource === 'members' && <><th>Name</th><th>Contact</th><th>Platform</th><th>Status</th><th>Valid until</th><th>Action</th></>}
            {resource === 'messages' && <><th>Sender</th><th>Subject</th><th>Message</th><th>State</th><th>Received</th><th>Action</th></>}
            {resource === 'subscribers' && <><th>Email</th><th>State</th><th>Joined</th><th>Action</th></>}
            {resource === 'statistics' && <><th>Label</th><th>Value</th><th>Order</th><th>State</th><th>Action</th></>}
            {resource === 'settings' && <><th>Key</th><th>Value</th><th>Updated</th><th>Action</th></>}
            {resource === 'gallery' && <><th>Title</th><th>Category</th><th>Featured</th><th>Image URL</th></>}
            {resource === 'resources' && <><th>Title</th><th>Category</th><th>Published</th><th>File</th></>}
            {resource === 'team' && <><th>Name</th><th>Position</th><th>Order</th><th>State</th></>}
            {resource === 'services' && <><th>Service</th><th>Category</th><th>Slug</th><th>State</th><th>Action</th></>}
            {resource === 'vehicles' && <><th>Vehicle</th><th>Category</th><th>Price / Rate</th><th>Availability</th><th>Action</th></>}
            {resource === 'rentals' && <><th>Requester</th><th>Vehicle</th><th>Dates</th><th>Status</th><th>Action</th></>}
            {resource === 'products' && <><th>Product</th><th>SKU</th><th>Stock</th><th>State</th><th>Action</th></>}
            {resource === 'recruitment' && <><th>Applicant</th><th>Contact</th><th>Experience</th><th>Status</th><th>Action</th></>}
          </tr></thead>
          <tbody>{records.map((record) => {
            const id = record.id;
            const deleteButton = deletable.has(resource) ? <button className="admin-action danger" disabled={busy === id} onClick={() => remove(id)}>DELETE</button> : null;
            if (resource === 'applications') return <tr key={id}><td data-label="Name"><strong>{String(record.firstName)} {String(record.lastName)}</strong></td><td data-label="Contact">{String(record.phone)}<br />{String(record.email || '')}</td><td data-label="Platform">{String(record.platform || '—')}</td><td data-label="Fee"><span className={`badge ${record.registrationPayment === 'PAID' ? 'badge-active' : 'badge-PENDING'}`}>{record.registrationPayment === 'PAID' ? 'FEE PAID' : 'FEE NOT REQUIRED'}</span></td><td data-label="Submitted">{dateValue(record.createdAt)}</td><td data-label="Action"><button className="admin-action" disabled={busy === id} onClick={() => update(id, { status: 'APPROVED' })}>APPROVE</button><button className="admin-action danger" disabled={busy === id} onClick={() => update(id, { status: 'REJECTED' })}>REJECT</button></td></tr>;
            if (resource === 'members') return <tr key={id}><td data-label="Name"><strong>{String(record.firstName)} {String(record.lastName)}</strong></td><td data-label="Contact">{String(record.phone)}<br />{String(record.email || '')}</td><td data-label="Platform">{String(record.platform || '—')}</td><td data-label="Status"><span className={`badge badge-${String(record.status)}`}>{String(record.status)}</span></td><td data-label="Valid until">{dateValue(record.membershipEndDate)}</td><td data-label="Action">{record.status === 'SUSPENDED' ? <button className="admin-action" disabled={busy === id} onClick={() => update(id, { status: 'APPROVED' })}>REINSTATE</button> : <button className="admin-action danger" disabled={busy === id} onClick={() => update(id, { status: 'SUSPENDED' })}>SUSPEND</button>}</td></tr>;
            if (resource === 'messages') return <tr key={id}><td data-label="Sender"><strong>{String(record.name)}</strong><br />{String(record.email)}</td><td data-label="Subject">{String(record.subject)}</td><td data-label="Message" className="admin-message-cell">{String(record.message)}</td><td data-label="State"><span className={`badge ${record.archived ? 'badge-ARCHIVED' : record.read ? 'badge-active' : 'badge-PENDING'}`}>{record.archived ? 'ARCHIVED' : record.read ? 'READ' : 'UNREAD'}</span></td><td data-label="Received">{dateValue(record.createdAt)}</td><td data-label="Action"><button className="admin-action" disabled={busy === id} onClick={() => update(id, { read: !record.read })}>{record.read ? 'MARK UNREAD' : 'MARK READ'}</button><button className="admin-action" disabled={busy === id} onClick={() => update(id, { archived: !record.archived })}>{record.archived ? 'RESTORE' : 'ARCHIVE'}</button>{deleteButton}</td></tr>;
            if (resource === 'subscribers') return <tr key={id}><td data-label="Email">{String(record.email)}</td><td data-label="State"><span className={`badge ${record.active ? 'badge-active' : 'badge-INACTIVE'}`}>{record.active ? 'ACTIVE' : 'REMOVED'}</span></td><td data-label="Joined">{dateValue(record.createdAt)}</td><td data-label="Action"><button className="admin-action" disabled={busy === id} onClick={() => update(id, { active: !record.active })}>{record.active ? 'DEACTIVATE' : 'ACTIVATE'}</button>{deleteButton}</td></tr>;
            if (resource === 'statistics') return <tr key={id}><td data-label="Label"><strong>{String(record.label)}</strong></td><td data-label="Value">{String(record.value)}</td><td data-label="Order">{String(record.displayOrder)}</td><td data-label="State"><span className={`badge ${record.active ? 'badge-active' : 'badge-INACTIVE'}`}>{record.active ? 'ACTIVE' : 'HIDDEN'}</span></td><td data-label="Action"><button className="admin-action" disabled={busy === id} onClick={() => update(id, { label: record.label, value: record.value, description: record.description, displayOrder: record.displayOrder, active: !record.active })}>{record.active ? 'HIDE' : 'SHOW'}</button>{deleteButton}</td></tr>;
            if (resource === 'settings') return <tr key={id}><td data-label="Key">{String(record.key)}</td><td data-label="Value">{String(record.value)}</td><td data-label="Updated">{dateValue(record.updatedAt)}</td><td data-label="Action"><button className="admin-action" onClick={() => { const value = window.prompt(`Value for ${String(record.key)}`, String(record.value)); if (value !== null) update(id, { key: record.key, value }); }}>EDIT</button></td></tr>;
            if (resource === 'gallery') return <tr key={id}><td data-label="Title">{String(record.title)}</td><td data-label="Category">{String(record.category || '—')}</td><td data-label="Featured">{record.featured ? 'Yes' : 'No'}</td><td data-label="Image"><a href={String(record.imageUrl)} target="_blank" rel="noreferrer" className="admin-link">OPEN</a></td></tr>;
            if (resource === 'resources') return <tr key={id}><td data-label="Title">{String(record.title)}</td><td data-label="Category">{String(record.category)}</td><td data-label="Published">{record.published ? 'Yes' : 'No'}</td><td data-label="File"><a href={String(record.fileUrl)} target="_blank" rel="noreferrer" className="admin-link">OPEN</a></td></tr>;
            if (resource === 'services') return <tr key={id}><td data-label="Service"><strong>{String(record.name)}</strong><br /><small>{String(record.description || '').slice(0, 90)}</small></td><td data-label="Category">{String(record.category || '—')}</td><td data-label="Slug">{String(record.slug)}</td><td data-label="State"><span className={`badge ${record.enabled ? 'badge-active' : 'badge-INACTIVE'}`}>{record.enabled ? 'LIVE' : 'HIDDEN'}</span></td><td data-label="Action"><button className="admin-action" disabled={busy === id} onClick={() => update(id, { enabled: !record.enabled })}>{record.enabled ? 'DISABLE' : 'ENABLE'}</button>{deleteButton}</td></tr>;
            if (resource === 'vehicles') return <tr key={id}><td data-label="Vehicle"><strong>{String(record.year)} {String(record.make)} {String(record.model)}</strong>{record.featured ? ' ★' : ''}</td><td data-label="Category">{String(record.category)}</td><td data-label="Price">{record.price ? `GHS ${Number(record.price).toLocaleString()}` : '—'}{record.dailyRate ? ` / GHS ${Number(record.dailyRate).toLocaleString()} day` : ''}</td><td data-label="Availability"><span className={`badge ${record.availability === 'AVAILABLE' ? 'badge-active' : 'badge-PENDING'}`}>{String(record.availability)}</span></td><td data-label="Action">{vehicleAvailability.filter((state) => state !== record.availability).map((state) => <button className="admin-action" key={state} disabled={busy === id} onClick={() => update(id, { availability: state })}>{state}</button>)}<button className="admin-action" disabled={busy === id} onClick={() => update(id, { featured: !record.featured })}>{record.featured ? 'UNFEATURE' : 'FEATURE'}</button>{deleteButton}</td></tr>;
            if (resource === 'rentals') return <tr key={id}><td data-label="Requester"><strong>{String(record.name)}</strong><br />{String(record.email)}{record.phone ? ` · ${String(record.phone)}` : ''}</td><td data-label="Vehicle">{record.vehicle ? `${String((record.vehicle as any).make)} ${String((record.vehicle as any).model)}` : 'Any vehicle'}</td><td data-label="Dates">{dateValue(record.startDate)} → {dateValue(record.endDate)}</td><td data-label="Status"><span className={`badge ${record.status === 'CONFIRMED' ? 'badge-active' : record.status === 'DECLINED' ? 'badge-REJECTED' : 'badge-PENDING'}`}>{String(record.status)}</span></td><td data-label="Action">{rentalStatuses.filter((state) => state !== record.status).map((state) => <button className="admin-action" key={state} disabled={busy === id} onClick={() => update(id, { status: state })}>{state}</button>)}{deleteButton}</td></tr>;
            if (resource === 'products') return <tr key={id}><td data-label="Product"><strong>{String(record.name)}</strong>{record.brand ? <><br /><small>{String(record.brand)}</small></> : null}</td><td data-label="SKU">{String(record.sku)}</td><td data-label="Stock">{String(record.stock)}</td><td data-label="State"><span className={`badge ${record.available ? 'badge-active' : 'badge-INACTIVE'}`}>{record.available ? 'LISTED' : 'HIDDEN'}</span></td><td data-label="Action"><button className="admin-action" disabled={busy === id} onClick={() => update(id, { available: !record.available })}>{record.available ? 'DELIST' : 'LIST'}</button>{deleteButton}</td></tr>;
            if (resource === 'recruitment') return <tr key={id}><td data-label="Applicant"><strong>{String(record.fullName)}</strong></td><td data-label="Contact">{String(record.email)}<br />{String(record.phone)}</td><td data-label="Experience">{String(record.experience || '—')}</td><td data-label="Status"><span className={`badge ${record.status === 'HIRED' ? 'badge-active' : record.status === 'DECLINED' ? 'badge-REJECTED' : 'badge-PENDING'}`}>{String(record.status)}</span></td><td data-label="Action">{driverStatuses.filter((state) => state !== record.status).map((state) => <button className="admin-action" key={state} disabled={busy === id} onClick={() => update(id, { status: state })}>{state}</button>)}</td></tr>;
            return <tr key={id}><td data-label="Name">{String(record.name)}</td><td data-label="Position">{String(record.position)}</td><td data-label="Order">{String(record.displayOrder)}</td><td data-label="State">{record.active ? 'Active' : 'Hidden'}</td></tr>;
          })}</tbody>
        </table>
      )}
    </section>
  );
}
