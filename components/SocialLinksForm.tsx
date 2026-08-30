'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import SocialIcon from '@/components/SocialIcon';
import type { SocialPlatformKey } from '@/lib/settings';

const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.4px' };

type LinkRow = { key: SocialPlatformKey; label: string; url: string };

/**
 * Admin editor for the social profile links shown in the public header and
 * footer. Blank = hidden on the site, so admins can simply leave unused
 * networks empty.
 */
export default function SocialLinksForm() {
  const [rows, setRows] = useState<LinkRow[] | null>(null);
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const response = await fetch('/api/admin/social');
    if (!response.ok) return;
    const data = await response.json();
    const links: LinkRow[] = data.links;
    setRows(links);
    setInitial(Object.fromEntries(links.map((link) => [link.key, link.url])));
  }

  useEffect(() => {
    void load();
  }, []);

  const dirty = rows ? rows.some((row) => row.url.trim() !== (initial[row.key] ?? '')) : false;
  const preview = rows?.filter((row) => row.url.trim()) ?? [];

  function setUrl(key: string, value: string) {
    setRows((current) => current?.map((row) => (row.key === key ? { ...row, url: value } : row)) ?? current);
    setMessage(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rows) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: rows.map((row) => ({ key: row.key, url: row.url.trim() })) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save the social links.');
      await load();
      setMessage({ ok: true, text: 'Social links saved — the public site shows them immediately.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Unable to save the social links.' });
    } finally {
      setBusy(false);
    }
  }

  if (!rows) return <div className="admin-panel"><p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading social links…</p></div>;

  return (
    <form onSubmit={save} className="admin-panel" style={{ display: 'grid', gap: 18, maxWidth: 720 }}>
      <div>
        <h2 style={{ margin: 0 }}>Social profiles</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>
          These links appear in the top bar and footer of every public page. Leave a field blank to hide that
          network — you only need to fill in the profiles Mr Truth Agency actually has.
        </p>
      </div>

      <div className="social-admin-grid">
        {rows.map((row) => (
          <div key={row.key} className="social-admin-row">
            <span className="social-admin-icon" aria-hidden><SocialIcon platform={row.key} size={16} /></span>
            <div style={{ minWidth: 0 }}>
              <label style={label} htmlFor={`social-${row.key}`}>{row.label.toUpperCase()}</label>
              <input
                id={`social-${row.key}`}
                className="field"
                value={row.url}
                onChange={(event) => setUrl(row.key, event.target.value)}
                placeholder={`https://${row.key === 'x' ? 'x.com' : row.key}.com/mrtruthagency`}
                autoComplete="off"
                spellCheck={false}
              />
              <small style={{ color: 'var(--muted)', fontSize: 11.5 }}>
                {row.url.trim()
                  ? <>Live at <a className="admin-link" href={row.url.trim().startsWith('http') ? row.url.trim() : `https://${row.url.trim()}`} target="_blank" rel="noreferrer"><ExternalLink size={10} style={{ verticalAlign: -1 }} /> open</a></>
                  : 'Hidden on the site'}
              </small>
            </div>
          </div>
        ))}
      </div>

      <div className="social-admin-preview">
        <p style={label}>HEADER PREVIEW</p>
        <div className="socials">
          <span>Follow us</span>
          {preview.length === 0 ? (
            <span style={{ opacity: .7 }}>Add at least one link to show the icons</span>
          ) : (
            preview.map((row) => (
              <a key={row.key} href={row.url} target="_blank" rel="noreferrer" aria-label={row.label}>
                <SocialIcon platform={row.key} />
              </a>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" type="submit" disabled={busy || !dirty} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {busy ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {busy ? 'SAVING...' : 'SAVE LINKS'}
        </button>
        {message && <p role="status" className={message.ok ? 'status-ok' : 'status-err'} style={{ margin: 0 }}>{message.text}</p>}
      </div>
    </form>
  );
}
