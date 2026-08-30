import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Car, Fuel, Gauge, Users } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Rentals', description: 'Browse rental vehicles and request dates from Mr Truth Agency.' };

export default async function RentalsPage() {
  const vehicles = await db.vehicle.findMany({ where: { availability: 'AVAILABLE', dailyRate: { not: null } }, include: { images: { orderBy: { position: 'asc' }, take: 1 } }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }] });
  return <><SiteHeader /><main><section className="page-hero"><div className="container"><p className="kicker">CAR RENTALS</p><h1>Move on your terms.</h1><p>Browse available rental vehicles and send your preferred dates. Our team will confirm availability and next steps.</p></div></section><section className="container page-body"><div className="vehicle-grid">{vehicles.length ? vehicles.map((vehicle) => <article className="vehicle-card" key={vehicle.id}>{vehicle.images[0] ? <img src={vehicle.images[0].url} alt={`${vehicle.make} ${vehicle.model}`} /> : <div className="vehicle-placeholder"><Car size={30} /> MRT</div>}<div className="vehicle-card-body"><span className="vehicle-category">{vehicle.category} · AVAILABLE</span><h2>{vehicle.make} {vehicle.model}</h2><p>{vehicle.dailyRate ? `GHS ${vehicle.dailyRate.toLocaleString()} / day` : 'Rate on request'}</p><div className="vehicle-meta"><span><Gauge size={14} /> {vehicle.transmission || '—'}</span><span><Fuel size={14} /> {vehicle.fuelType || '—'}</span><span><Users size={14} /> {vehicle.seats || '—'} seats</span></div><Link href={`/contact?vehicle=${encodeURIComponent(`${vehicle.make} ${vehicle.model}`)}&type=rental`} className="btn btn-primary">REQUEST RENTAL <ArrowRight size={14} /></Link></div></article>) : <div className="empty-state"><h2>Rental vehicles are being prepared.</h2><p>Contact Mr Truth Agency for current rental availability and rates.</p><Link href="/contact?type=rental" className="btn btn-primary">REQUEST AVAILABILITY <ArrowRight size={14} /></Link></div>}</div></section></main><SiteFooter /></>;
}
