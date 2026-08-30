import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, PackageSearch } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Automotive Goods', description: 'Explore spare parts, accessories and automotive goods from Mr Truth Agency.' };

export default async function AutomotivePage() {
  const products = await db.product.findMany({ where: { available: true }, include: { category: true }, orderBy: { createdAt: 'desc' } });
  return <><SiteHeader /><main><section className="page-hero"><div className="container"><p className="kicker">AUTOMOTIVE GOODS</p><h1>Keep every journey equipped.</h1><p>Explore the foundation for spare parts, accessories, oils, fluids and equipment from Mr Truth Agency.</p></div></section><section className="container page-body"><div className="product-grid">{products.length ? products.map((product) => <article className="product-card" key={product.id}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="product-placeholder"><PackageSearch size={30} /></div>}<div><span className="vehicle-category">{product.category?.name || 'AUTOMOTIVE GOODS'}</span><h2>{product.name}</h2><p>{product.description || 'Product details available on request.'}</p>{product.brand && <small>{product.brand} · SKU {product.sku}</small>}<Link href={`/contact?product=${encodeURIComponent(product.name)}`} className="read">REQUEST INFORMATION <ArrowRight size={13} /></Link></div></article>) : <div className="empty-state"><h2>Product catalogue is being prepared.</h2><p>Contact the agency for parts, accessories and automotive goods availability.</p><Link href="/contact" className="btn btn-primary">CONTACT THE AGENCY <ArrowRight size={14} /></Link></div>}</div></section></main><SiteFooter /></>;
}
