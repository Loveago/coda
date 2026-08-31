import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, PackageSearch, Truck } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { db } from '@/lib/db';
import { formatGhs } from '@/lib/fees';

export const metadata: Metadata = { title: 'Automotive Goods', description: 'Explore spare parts, accessories and automotive goods from Mr Truth Agency.' };
export const dynamic = 'force-dynamic';

export default async function AutomotivePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: categorySlug } = await searchParams;
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { available: true, ...(categorySlug ? { category: { slug: categorySlug } } : {}) }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
    db.productCategory.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } })
  ]);
  const activeCategories = categories.filter((category) => category._count.products > 0);
  return <>
    <SiteHeader />
    <main>
      <section className="page-hero"><div className="container"><p className="kicker">AUTOMOTIVE GOODS</p><h1>Keep every journey equipped.</h1><p>Genuine spare parts, accessories, oils, fluids and equipment from Mr Truth Agency — with real prices and live stock availability.</p></div></section>
      <section className="container page-body">
        {activeCategories.length > 0 && (
          <div className="payfilters" role="navigation" aria-label="Filter products by category" style={{ marginBottom: 22 }}>
            <Link href="/automotive" className={`payfilter${!categorySlug ? ' on' : ''}`}>ALL</Link>
            {activeCategories.map((category) => (
              <Link key={category.id} href={`/automotive?category=${category.slug}`} className={`payfilter${categorySlug === category.slug ? ' on' : ''}`}>{category.name.toUpperCase()}</Link>
            ))}
          </div>
        )}
        <div className="product-grid">
          {products.length ? products.map((product) => (
            <article className="product-card" key={product.id}>
              {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="product-placeholder"><PackageSearch size={30} /></div>}
              <div>
                <span className="vehicle-category">{product.category?.name || 'AUTOMOTIVE GOODS'}</span>
                <h2>{product.name}</h2>
                <p>{product.description || 'Product details available on request.'}</p>
                {product.brand && <small>{product.brand} · SKU {product.sku}</small>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: "'Barlow Condensed'", fontSize: 19, color: 'var(--navy)' }}>{product.price ? formatGhs(product.price) : 'PRICE ON REQUEST'}</strong>
                  <span style={{ fontSize: 11, fontWeight: 700, color: product.stock > 0 ? 'var(--green, #1E8E3E)' : 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {product.stock > 0 ? <><BadgeCheck size={13} /> IN STOCK ({product.stock})</> : <><Truck size={13} /> ORDER IN</>}
                  </span>
                </div>
                <Link href={`/contact?product=${encodeURIComponent(product.name)}`} className="read">REQUEST INFORMATION <ArrowRight size={13} /></Link>
              </div>
            </article>
          )) : <div className="empty-state"><h2>Product catalogue is being prepared.</h2><p>Contact the agency for parts, accessories and automotive goods availability.</p><Link href="/contact" className="btn btn-primary">CONTACT THE AGENCY <ArrowRight size={14} /></Link></div>}
        </div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
