'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';

type Item = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  altText: string;
  category: string | null;
  featured: boolean;
  displayOrder: number;
};

const field = { padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 9, background: '#fff', fontSize: 12.5, width: '100%' };

export default function GalleryManager({ items: initialItems }: { items: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [resolving, setResolving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLink = useRef('');
  const resolvingRef = useRef(false);

  function switchMode(next: 'upload' | 'link') {
    setMode(next);
    if (next === 'upload') {
      if (resolveTimer.current) clearTimeout(resolveTimer.current);
      latestLink.current = '';
      setPreviewUrl('');
      setUploadedUrl('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleLink(value: string) {
    const url = value.trim();
    latestLink.current = url;
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    if (!url) {
      setUploadedUrl('');
      setPreviewUrl('');
      setMessage(null);
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('bad protocol');
    } catch {
      setUploadedUrl('');
      setPreviewUrl('');
      setMessage({ ok: false, text: 'Enter a valid image link starting with http:// or https://' });
      return;
    }
    setUploadedUrl(url);
    setPreviewUrl(url);
    setMessage(null);
    // Page-style links (e.g. https://ibb.co/abc123) are not direct images – ask the
    // server to find the actual image file behind them before giving up.
    resolveTimer.current = setTimeout(() => {
      void resolveShareLink(url);
    }, 500);
  }

  async function resolveShareLink(url: string) {
    setResolving(true);
    resolvingRef.current = true;
    try {
      const response = await fetch('/api/admin/resolve-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const result = await response.json().catch(() => null);
      if (latestLink.current !== url) return;
      if (response.ok && result?.resolved && result?.url && result.url !== url) {
        setUploadedUrl(result.url);
        setPreviewUrl(result.url);
        setMessage({ ok: true, text: 'Converted the share link into a direct image link.' });
      }
    } catch {
      // Nothing to do – the preview onError reports unreachable links.
    } finally {
      setResolving(false);
      resolvingRef.current = false;
    }
  }

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
      setPreviewUrl(result.url);
      setMessage({ ok: true, text: `Image uploaded (${result.driver === 'local' ? 'local storage' : 'blob storage'}). Add a title and save.` });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadedUrl) {
      setMessage({ ok: false, text: 'Upload an image first.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/management/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          caption: form.get('caption'),
          altText: form.get('altText'),
          category: form.get('category'),
          featured: form.get('featured') === 'on',
          displayOrder: Number(form.get('displayOrder') || 0),
          imageUrl: uploadedUrl
        })
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Could not save the gallery item.');
      setItems((current) => [created, ...current]);
      setUploadedUrl('');
      setPreviewUrl('');
      if (fileRef.current) fileRef.current.value = '';
      event.currentTarget.reset();
      setMessage({ ok: true, text: 'Photo added to the gallery.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Could not save the gallery item.' });
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, data: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/management/gallery', {
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
    if (!window.confirm('Remove this photo from the gallery?')) return;
    setBusy(true);
    try {
      const response = await fetch('/api/admin/management/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error('Delete failed.');
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage({ ok: true, text: 'Photo removed.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Delete failed.' });
    } finally {
      setBusy(false);
    }
  }

  return <section style={{ display: 'grid', gap: 22 }}>
    <div className="admin-panel">
      <h2>Add a photo</h2>
      <form onSubmit={create} style={{ display: 'grid', gap: 14 }}>
        <div className="mode-tabs" role="tablist" aria-label="Image source">
          <button type="button" role="tab" aria-selected={mode === 'upload'} className={mode === 'upload' ? 'chip active' : 'chip'} onClick={() => switchMode('upload')}>UPLOAD IMAGE</button>
          <button type="button" role="tab" aria-selected={mode === 'link'} className={mode === 'link' ? 'chip active' : 'chip'} onClick={() => switchMode('link')}>USE IMAGE LINK</button>
        </div>
        {mode === 'upload' ? (
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
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Upload preview" className="upload-preview" />
            ) : (
              <span className="upload-hint">
                {uploading ? <Loader2 size={26} className="spin" /> : <ImagePlus size={26} />}
                {uploading ? 'Uploading...' : <>Click or drag an image here<small>JPG, PNG, WebP or GIF · up to 5 MB</small></>}
              </span>
            )}
          </label>
        ) : (
          <>
            <input
              type="url"
              placeholder="Paste an image link — a direct file or a share page (e.g. ImgBB)"
              style={field}
              aria-label="Image link"
              onChange={(event) => handleLink(event.target.value)}
            />
            {resolving && (
              <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.75 }}>Looking up the direct image behind that link…</p>
            )}
            {previewUrl && (
              <div className="upload-dropzone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="Link preview"
                  className="upload-preview"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = 'none';
                    if (!resolvingRef.current) {
                      setMessage({ ok: false, text: 'That link could not be loaded as an image. Use a direct link to an image file — on sites like ImgBB, open the photo, right-click it and choose “Copy image address”.' });
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <input name="title" required placeholder="Title *" style={field} aria-label="Title" />
          <input name="category" placeholder="Category (e.g. Events)" style={field} aria-label="Category" />
          <input name="displayOrder" type="number" placeholder="Display order" style={field} aria-label="Display order" defaultValue={0} />
        </div>
        <input name="altText" placeholder="Alt text (describe the image for accessibility)" style={field} aria-label="Alt text" />
        <input name="caption" placeholder="Caption shown under the photo" style={field} aria-label="Caption" />
        <label style={{ fontSize: 12.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="featured" /> Mark as featured
        </label>
        <button className="btn btn-primary" disabled={busy || uploading} style={{ justifySelf: 'start' }}>
          <Upload size={15} /> {busy ? 'SAVING...' : 'ADD TO GALLERY'}
        </button>
      </form>
      {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ marginTop: 12 }}>{message.text}</p>}
    </div>

    <div className="admin-panel">
      <h2>Gallery photos ({items.length})</h2>
      {items.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>No photos yet — add the first one above.</p>
      ) : (
        <div className="manager-grid">
          {items.map((item) => (
            <figure className="manager-card" key={item.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.altText} loading="lazy" />
              <figcaption>
                <strong>{item.title}</strong>
                <small>{item.category || 'Uncategorized'}{item.featured ? ' · FEATURED' : ''}</small>
                <div className="manager-controls">
                  <input
                    defaultValue={item.title}
                    aria-label={`Rename ${item.title}`}
                    onBlur={(event) => { const value = event.target.value.trim(); if (value && value !== item.title) update(item.id, { title: value }); }}
                    style={field}
                  />
                  <input
                    defaultValue={item.category || ''}
                    placeholder="Category"
                    aria-label={`Category for ${item.title}`}
                    onBlur={(event) => { const value = event.target.value.trim(); if (value !== (item.category || '')) update(item.id, { category: value }); }}
                    style={field}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" className="admin-action" disabled={busy} onClick={() => update(item.id, { featured: !item.featured })}>{item.featured ? 'UNFEATURE' : 'FEATURE'}</button>
                    <a type="button" className="admin-action" href={item.imageUrl} target="_blank" rel="noreferrer">VIEW</a>
                    <button type="button" className="admin-action danger" disabled={busy} onClick={() => remove(item.id)}><Trash2 size={12} /> DELETE</button>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  </section>;
}
