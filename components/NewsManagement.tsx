'use client';

import { useEffect, useState } from 'react';

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  category?: { name: string } | null;
  author: { name: string };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string | null;
  updatedAt: string;
};

const statusOptions = ['', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export default function NewsManagement({ initialArticles }: { initialArticles: ArticleRow[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const categories = Array.from(new Set(articles.map((article) => article.category?.name).filter(Boolean) as string[])).sort();
  const filtered = articles
    .filter((article) => !query || `${article.title} ${article.slug} ${article.author.name}`.toLowerCase().includes(query.toLowerCase()))
    .filter((article) => !status || article.status === status)
    .filter((article) => !category || article.category?.name === category)
    .sort((a, b) => sort === 'newest' ? +new Date(b.updatedAt) - +new Date(a.updatedAt) : +new Date(a.updatedAt) - +new Date(b.updatedAt));

  useEffect(() => setSelected((current) => current.filter((id) => filtered.some((article) => article.id === id))), [query, status, category]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function bulkAction(action: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'DELETE') {
    if (!selected.length || (action === 'DELETE' && !window.confirm('Delete the selected articles permanently?'))) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/news/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected, action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Bulk action failed.');
      if (action === 'DELETE') setArticles((current) => current.filter((article) => !selected.includes(article.id)));
      else setArticles((current) => current.map((article) => selected.includes(article.id) ? { ...article, status: action, publishedAt: action === 'PUBLISHED' ? new Date().toISOString() : null } : article));
      setSelected([]);
      setMessage(`${result.count} article(s) updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bulk action failed.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <section className="admin-toolbar">
      <input aria-label="Search articles" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, slug, or author" />
      <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((item) => <option key={item} value={item}>{item || 'All statuses'}</option>)}</select>
      <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label="Sort articles" value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
    </section>
    {selected.length > 0 && <section className="admin-bulkbar" aria-live="polite"><strong>{selected.length} selected</strong><button className="admin-action" disabled={busy} onClick={() => bulkAction('PUBLISHED')}>PUBLISH</button><button className="admin-action" disabled={busy} onClick={() => bulkAction('DRAFT')}>UNPUBLISH</button><button className="admin-action" disabled={busy} onClick={() => bulkAction('ARCHIVED')}>ARCHIVE</button><button className="admin-action" disabled={busy} onClick={() => bulkAction('DELETE')}>DELETE</button></section>}
    {message && <p role="status" style={{ color: 'var(--blue)' }}>{message}</p>}
    <div className="admin-empty" style={{ maxWidth: 'none', overflowX: 'auto' }}>
      {filtered.length === 0 ? <p>No matching articles found.</p> : <table className="admin-table card-table"><thead><tr><th><input aria-label="Select all visible articles" type="checkbox" checked={filtered.length > 0 && filtered.every((article) => selected.includes(article.id))} onChange={(event) => setSelected(event.target.checked ? filtered.map((article) => article.id) : [])} /></th><th>Title</th><th>Category</th><th>Author</th><th>Status</th><th>Published</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map((article) => <tr key={article.id}><td data-label="Select"><input aria-label={`Select ${article.title}`} type="checkbox" checked={selected.includes(article.id)} onChange={() => toggle(article.id)} /></td><td data-label="Title"><strong>{article.title}</strong><br /><small>{article.slug}</small></td><td data-label="Category">{article.category?.name || 'Uncategorized'}</td><td data-label="Author">{article.author.name}</td><td data-label="Status"><span className={`badge badge-${article.status}`}>{article.status}</span></td><td data-label="Published">{article.publishedAt ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(article.publishedAt)) : '—'}</td><td data-label="Updated">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(article.updatedAt))}</td><td data-label="Actions"><a className="admin-action" href={`/admin/news/${article.id}`}>EDIT</a><a className="admin-action" href={`/news/${article.slug}`} target="_blank" rel="noreferrer">VIEW</a></td></tr>)}</tbody></table>}
    </div>
  </>;
}
