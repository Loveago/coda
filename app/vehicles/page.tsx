import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Fuel, Gauge, Users } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Vehicles', description: 'Explore vehicle sourcing and sales through Mr Truth Agency.' };

export default async function VehiclesPage() {
  const vehicles = await db.vehicle.findMany({
    where: { availability: { not: 'SOLD' } },
    include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="container">
            <p className="kicker">VEHICLE SOLUTIONS</p>
            <h1>Find the right vehicle for what comes next.</h1>
            <p>Browse vehicle listings and request information, a viewing or sourcing support from Mr Truth Agency.</p>
          </div>
        </section>
        <section className="container page-body">
          <div className="vehicle-grid">
            {vehicles.length ? (
              vehicles.map((vehicle) => (
                <article className="vehicle-card" key={vehicle.id}>
                  {vehicle.images[0] ? (
                    <img src={vehicle.images[0].url} alt={`${vehicle.make} ${vehicle.model}`} />
                  ) : (
                    <div className="vehicle-placeholder">MR TRUTH</div>
                  )}
                  <div className="vehicle-card-body">
                    <span className="vehicle-category">{vehicle.category}</span>
                    <h2>{vehicle.make} {vehicle.model}</h2>
                    <p>{vehicle.year} · {vehicle.availability}</p>
                    <div className="vehicle-meta">
                      <span><Gauge size={14} /> {vehicle.transmission || '—'}</span>
                      <span><Fuel size={14} /> {vehicle.fuelType || '—'}</span>
                      <span><Users size={14} /> {vehicle.seats || '—'} seats</span>
                    </div>
                    <Link href={`/contact?vehicle=${encodeURIComponent(`${vehicle.make} ${vehicle.model}`)}`} className="btn btn-primary">REQUEST DETAILS <ArrowRight size={14} /></Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h2>Vehicle listings are being prepared.</h2>
                <p>Contact Mr Truth Agency for sourcing support and upcoming availability.</p>
                <Link href="/contact" className="btn btn-primary">CONTACT THE AGENCY <ArrowRight size={14} /></Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
