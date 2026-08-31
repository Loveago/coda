'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

/**
 * Drag-and-drop / click image uploader used by the admin catalogue managers.
 * Uploads go through /api/admin/upload (Vercel Blob when configured, local
 * disk otherwise) and report back the stored URLs.
 */
export default function ImageUploadField({
  urls,
  onChange,
  max = 6,
  label = 'Photos',
  hint = 'JPG, PNG, WebP or GIF · up to 5 MB each'
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    setBusy(true);
    setError('');
    for (const file of Array.from(files)) {
      if (urls.length >= max) {
        setError(`Maximum ${max} images.`);
        break;
      }
      try {
        const data = new FormData();
        data.append('file', file);
        const response = await fetch('/api/admin/upload', { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload failed.');
        urls = [...urls, result.url];
        onChange(urls);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.');
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <label
        className="upload-dropzone"
        style={{ padding: 14 }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files?.length) upload(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) upload(event.target.files);
          }}
        />
        <span className="upload-hint" style={{ fontSize: 11.5 }}>
          {busy ? <Loader2 size={20} className="spin" /> : <ImagePlus size={20} />}
          {busy ? 'Uploading…' : <>Click or drag {label.toLowerCase()} here<small>{hint}</small></>}
        </span>
      </label>
      {urls.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {urls.map((url, index) => (
            <span key={`${url}-${index}`} style={{ position: 'relative', display: 'inline-block' }}>
              <img src={url} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)', display: 'block' }} />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(urls.filter((_, i) => i !== index))}
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 0, background: '#C0392B', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p role="alert" className="status-err" style={{ fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
