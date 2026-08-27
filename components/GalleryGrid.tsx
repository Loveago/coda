'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Item = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  altText: string;
  category: string | null;
  featured: boolean;
};

export default function GalleryGrid({ items }: { items: Item[] }) {
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[]));
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState<number | null>(null);
  const filtered = filter ? items.filter((item) => item.category === filter) : items;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (active === null) return;
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowRight') setActive((current) => (current === null ? null : (current + 1) % filtered.length));
      if (event.key === 'ArrowLeft') setActive((current) => (current === null ? null : (current - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = active !== null ? 'hidden' : '';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active, filtered.length]);

  const current = active !== null ? filtered[active] : null;

  return <>
    {categories.length > 0 && <div className="gallery-filters" role="tablist" aria-label="Gallery categories">
      <button className={filter === '' ? 'chip active' : 'chip'} onClick={() => setFilter('')}>ALL</button>
      {categories.map((category) => (
        <button key={category} className={filter === category ? 'chip active' : 'chip'} onClick={() => setFilter(category)}>{category.toUpperCase()}</button>
      ))}
    </div>}
    <div className="gallery-grid">
      {filtered.map((item, index) => (
        <figure className="gallery-item" key={item.id} style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}>
          <button type="button" onClick={() => setActive(index)} aria-label={`Open image: ${item.title}`}>
            <img src={item.imageUrl} alt={item.altText} loading="lazy" />
            {item.featured && <span className="gallery-featured">FEATURED</span>}
          </button>
          <figcaption>{item.caption || item.title}</figcaption>
        </figure>
      ))}
    </div>
    {current && (
      <div className="lightbox" role="dialog" aria-modal="true" aria-label={current.title} onClick={() => setActive(null)}>
        <button type="button" className="lightbox-close" aria-label="Close"><X size={22} /></button>
        <button type="button" className="lightbox-nav lightbox-prev" aria-label="Previous image" onClick={(event) => { event.stopPropagation(); setActive((current2) => (current2 === null ? null : (current2 - 1 + filtered.length) % filtered.length)); }}><ChevronLeft size={26} /></button>
        <figure onClick={(event) => event.stopPropagation()}>
          <img src={current.imageUrl} alt={current.altText} />
          <figcaption>{current.caption || current.title}</figcaption>
        </figure>
        <button type="button" className="lightbox-nav lightbox-next" aria-label="Next image" onClick={(event) => { event.stopPropagation(); setActive((current2) => (current2 === null ? null : (current2 + 1) % filtered.length)); }}><ChevronRight size={26} /></button>
      </div>
    )}
  </>;
}
