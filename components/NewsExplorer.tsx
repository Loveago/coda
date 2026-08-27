'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  categoryName: string | null;
  dateLabel: string;
};

export default function NewsExplorer({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(articles.map((article) => article.categoryName).filter(Boolean) as string[])).sort(),
    [articles]
  );

  const filtered = articles.filter((article) => {
    const matchesQuery = !query || `${article.title} ${article.excerpt}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !category || article.categoryName === category;
    return matchesQuery && matchesCategory;
  });

  return <>
    <div className="news-explorer">
      <label className="news-search">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search news and updates..." aria-label="Search news" />
      </label>
      {categories.length > 0 && <div className="gallery-filters" style={{ marginBottom: 0 }}>
        <button type="button" className={category === '' ? 'chip active' : 'chip'} onClick={() => setCategory('')}>ALL</button>
        {categories.map((item) => (
          <button type="button" key={item} className={category === item ? 'chip active' : 'chip'} onClick={() => setCategory(item)}>{item.toUpperCase()}</button>
        ))}
      </div>}
    </div>
    {filtered.length === 0 ? (
      <section className="empty-state">
        <h2>No matching articles</h2>
        <p>Try a different search term or category.</p>
      </section>
    ) : (
      <div className="news-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {filtered.map((article) => (
          <article className="news-card" key={article.id}>
            <div className="news-img" style={{ backgroundImage: `url(${article.coverImage || 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=700&q=80'})` }} />
            <div className="news-body">
              <span className="news-date">{article.categoryName || 'GACODA NEWS'} · {article.dateLabel}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <Link className="read" href={`/news/${article.slug}`}>READ MORE <ArrowRight size={12} /></Link>
            </div>
          </article>
        ))}
      </div>
    )}
  </>;
}
