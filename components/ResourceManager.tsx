'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';

type Item = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  published: boolean;
};

const field = { padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 9, background: '#fff', fontSize: 12.5, width: '100%' };

export default function ResourceManager({ items: initialItems }: { items: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedName, setUploadedName] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      setUploadedUrl(result.url);
      setUploadedName(file.name);
      setMessage({ ok: true, text: `PDF uploaded (${result.driver === 'local' ? 'local storage' : 'blob storage'}). Fill in the details and save.` });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadedUrl) {
      setMessage({ ok: false, text: 'Upload a PDF first.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/management/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          description: form.get('description'),
          category: form.get('category'),
          published: form.get('published') === 'on',
          fileUrl: uploadedUrl
        })
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not save the resource.');
      setItems((current) => [created, ...current]);
      setUploadedUrl('');
      setUploadedName('');
      if (fileRef.current) fileRef.current.value = '';
      event.currentTarget.reset();
      setMessage({ ok: true, text: created.published ? 'Resource saved and published.' : 'Resource saved as a draft.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Could not save the resource.' });
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, data: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/management/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed.');
      setItems((current) => current.map((item) => (item.id === id ? { ...item, ...result } : item)));
      setMessage({ ok: true, text: 'Changes saved.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Update failed.' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this resource permanently?')) return;
    setBusy(true);
    try {
      const response = await fetch('/api/admin/management/resources', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error('Delete failed.');
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage({ ok: true, text: 'Resource deleted.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Delete failed.' });
    } finally {
      setBusy(false);
    }
  }

  return <section style={{ display: 'grid', gap: 22 }}>
    <div className="admin-panel">
      <h2>Add a resource</h2>
      <form onSubmit={create} style={{ display: 'grid', gap: 14 }}>
        <label
          className="upload-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <span className="upload-hint">
            {uploading ? <Loader2 size={26} className="spin" /> : <FileText size={26} />}
            {uploading ? 'Uploading...' : uploadedUrl ? <>PDF ready: <strong>{uploadedName}</strong><small>Click to replace</small></> : <>Click or drag a PDF here<small>PDF only · up to 15 MB</small></>}
          </span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <input name="title" required placeholder="Title *" style={field} aria-label="Title" />
          <input name="category" required placeholder="Category * (Guide, Policy, Safety...)" style={field} aria-label="Category" />
        </div>
        <textarea name="description" required rows={3} placeholder="Description *" style={field} aria-label="Description" />
        <label style={{ fontSize: 12.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="published" defaultChecked /> Publish immediately (visible on the public Resources page)
        </label>
        <button className="btn btn-primary" disabled={busy || uploading} style={{ justifySelf: 'start' }}>
          <Upload size={15} /> {busy ? 'SAVING...' : 'ADD RESOURCE'}
        </button>
      </form>
      {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ marginTop: 12 }}>{message.text}</p>}
    </div>

    <div className="admin-panel">
      <h2>Resources ({items.length})</h2>
      {items.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>No resources yet — add the first one above.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>File</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.title}</strong><br /><small style={{ color: 'var(--muted)' }}>{item.description.slice(0, 80)}{item.description.length > 80 ? '…' : ''}</small></td>
                <td>{item.category}</td>
                <td><span className={`badge ${item.published ? 'badge-PUBLISHED' : 'badge-DRAFT'}`}>{item.published ? 'PUBLISHED' : 'DRAFT'}</span></td>
                <td><a className="admin-link" href={item.fileUrl} target="_blank" rel="noreferrer">OPEN PDF</a></td>
                <td>
                  <button type="button" className="admin-action" disabled={busy} onClick={() => update(item.id, { published: !item.published })}>{item.published ? 'UNPUBLISH' : 'PUBLISH'}</button>
                  <button type="button" className="admin-action danger" disabled={busy} onClick={() => remove(item.id)}><Trash2 size={12} /> DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </section>;
}
