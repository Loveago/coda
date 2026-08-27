'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

const field = { padding: '14px 16px', border: '1px solid #dbe5f4', borderRadius: 8, background: '#fff', fontSize: 13 };

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category?: { name: string } | null;
  coverImage?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  openGraphImage?: string | null;
  canonicalUrl?: string | null;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ArticleEditor({ article }: { article?: Article }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState(article?.slug || '');
  const [slugEdited, setSlugEdited] = useState(Boolean(article));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const endpoint = article ? `/api/admin/news/${article.id}` : '/api/admin/news';
      const response = await fetch(endpoint, { method: article ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save article.');
      setStatus('Article saved successfully.');
      if (!article && result.id) window.location.href = `/admin/news/${result.id}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save article right now.');
    } finally {
      setBusy(false);
    }
  }

  async function preview() {
    if (!article) {
      setStatus('Save the article before opening a secure preview.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/news/${article.id}/preview`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to create preview.');
      window.open(`/news/${slug}/preview?token=${encodeURIComponent(result.token)}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to create preview.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!article || !window.confirm('Delete this article permanently?')) return;
    setBusy(true);
    const response = await fetch(`/api/admin/news/${article.id}`, { method: 'DELETE' });
    if (response.ok) window.location.href = '/admin/news';
    else setStatus('Unable to delete article.');
    setBusy(false);
  }

  return <main style={{ minHeight: '100vh', background: '#f4f7fc', padding: '55px 6%' }}>
    <Link href="/admin/news" style={{ color: 'var(--blue)', fontSize: 12 }}>← BACK TO NEWS</Link>
    <h1 style={{ fontFamily: 'Barlow Condensed', fontSize: 44, margin: '20px 0' }}>{article ? 'Edit news article' : 'Create news article'}</h1>
    <form onSubmit={submit} style={{ background: '#fff', borderRadius: 14, padding: 26, maxWidth: 900, display: 'grid', gap: 16 }}>
      <input name="title" required defaultValue={article?.title} placeholder="Article title" style={field} onChange={(event) => { if (!slugEdited) setSlug(slugify(event.target.value)); }} />
      <input name="slug" required value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} placeholder="URL slug, for example town-hall-meeting" style={field} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><input name="category" defaultValue={article?.category?.name} placeholder="Category" style={field} /><select name="status" style={field} defaultValue={article?.status || 'DRAFT'}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></div>
      <input name="publishedAt" type="datetime-local" defaultValue={article?.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 16) : ''} style={field} />
      <input name="coverImage" type="url" defaultValue={article?.coverImage || ''} placeholder="Featured image URL" style={field} />
      <input name="openGraphImage" type="url" defaultValue={article?.openGraphImage || ''} placeholder="Open Graph image URL (optional)" style={field} />
      <input name="canonicalUrl" type="url" defaultValue={article?.canonicalUrl || ''} placeholder="Canonical URL (optional)" style={field} />
      <input name="seoTitle" defaultValue={article?.seoTitle || ''} placeholder="SEO title" style={field} />
      <input name="seoDescription" defaultValue={article?.seoDescription || ''} placeholder="SEO description" style={field} />
      <textarea name="excerpt" required rows={4} defaultValue={article?.excerpt} placeholder="Short excerpt" style={field} />
      <textarea name="content" required rows={12} defaultValue={article?.content} placeholder="Article content" style={field} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><button className="btn btn-primary" disabled={busy}>{busy ? 'SAVING...' : 'SAVE ARTICLE'}</button>{article && <button type="button" className="btn" onClick={preview} disabled={busy}>PREVIEW</button>}{article && <button type="button" className="btn" style={{ color: '#b42318' }} onClick={remove} disabled={busy}>DELETE</button>}<Link href="/news" className="btn" style={{ background: '#eaf3ff', color: 'var(--blue)' }}>VIEW NEWS</Link></div>
      {status && <p role="status" style={{ color: 'var(--blue)' }}>{status}</p>}
    </form>
  </main>;
}
