'use client';

import { FormEvent, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

type Profile = {
  phone: string;
  location: string | null;
  platform: string | null;
  vehicleInfo: string | null;
  vehicleRegistration: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelationship: string | null;
  emergency2Name: string | null;
  emergency2Phone: string | null;
  emergency2Relationship: string | null;
  photoUrl: string | null;
};

const field = { padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', fontSize: 13, width: '100%' };
const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 };
const optional = <span className="opt-badge">OPTIONAL</span>;

export default function ProfileEditor({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/member/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save.');
      setProfile((current) => ({ ...current, ...result.profile }));
      setMessage({ ok: true, text: 'Profile updated.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Unable to save.' });
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      const saveResponse = await fetch('/api/member/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoUrl: result.url }) });
      if (!saveResponse.ok) throw new Error('Could not attach the photo.');
      setProfile((current) => ({ ...current, photoUrl: result.url }));
      setMessage({ ok: true, text: 'Profile photo updated.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="admin-panel" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 0, cursor: 'pointer', position: 'relative' }} aria-label="Change profile photo">
          {profile.photoUrl
            ? <img src={profile.photoUrl} alt="Profile" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }} />
            : <span className="admin-avatar" style={{ width: 84, height: 84, fontSize: 28 }}>{initialsPlaceholder(profile)}</span>}
          <span className="admin-stat-icon" style={{ position: 'absolute', right: -6, bottom: -6, width: 30, height: 30, borderRadius: '50%' }}>
            {uploading ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadPhoto(file); }} />
        <div>
          <h2 style={{ margin: 0 }}>Profile photo</h2>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '4px 0 0' }}>JPG, PNG or WebP · up to 5 MB</p>
        </div>
      </div>

      <form onSubmit={save} className="admin-panel" style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Editable details</h2>
        <div className="form-grid">
          <div><label style={label}>Phone</label><input name="phone" defaultValue={profile.phone} required className="field" /></div>
          <div><label style={label}>Location</label><input name="location" defaultValue={profile.location || ''} className="field" /></div>
          <div><label style={label}>Driving platform</label><input name="platform" defaultValue={profile.platform || ''} className="field" /></div>
          <div><label style={label}>Vehicle information</label><input name="vehicleInfo" defaultValue={profile.vehicleInfo || ''} className="field" /></div>
          <div><label style={label}>Vehicle registration</label><input name="vehicleRegistration" defaultValue={profile.vehicleRegistration || ''} className="field" /></div>
        </div>
        <p className="section-label" style={{ margin: 0 }}>EMERGENCY CONTACTS</p>
        <p className="subsection-label">Contact 1</p>
        <div className="form-grid">
          <div><label style={label}>Name *</label><input name="emergencyName" defaultValue={profile.emergencyName || ''} required minLength={2} className="field" /></div>
          <div><label style={label}>Phone *</label><input name="emergencyPhone" defaultValue={profile.emergencyPhone || ''} required minLength={7} className="field" /></div>
          <div><label style={label}>Relationship *</label><input name="emergencyRelationship" defaultValue={profile.emergencyRelationship || ''} required minLength={2} className="field" /></div>
        </div>
        <p className="subsection-label" style={{ marginTop: 6 }}>Contact 2{optional}</p>
        <div className="form-grid">
          <div><label style={label}>Name{optional}</label><input name="emergency2Name" defaultValue={profile.emergency2Name || ''} className="field" /></div>
          <div><label style={label}>Phone{optional}</label><input name="emergency2Phone" defaultValue={profile.emergency2Phone || ''} className="field" /></div>
          <div><label style={label}>Relationship{optional}</label><input name="emergency2Relationship" defaultValue={profile.emergency2Relationship || ''} className="field" /></div>
        </div>
        <button className="btn btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'SAVING...' : 'SAVE CHANGES'}</button>
        {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ margin: 0 }}>{message.text}</p>}
      </form>
    </div>
  );
}

function initialsPlaceholder(profile: Profile) {
  return profile.photoUrl ? '' : 'GA';
}
