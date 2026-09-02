import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    { url: base },
    { url: `${base}/about` },
    { url: `${base}/services` },
    { url: `${base}/services/driver-recruitment` },
    { url: `${base}/services/fleet-management` },
    { url: `${base}/services/cleaning` },
    { url: `${base}/vehicles` },
    { url: `${base}/rentals` },
    { url: `${base}/automotive` },
    { url: `${base}/membership` },
    { url: `${base}/fan-club/join` },
    { url: `${base}/membership-status` },
    { url: `${base}/news` },
    { url: `${base}/gallery` },
    { url: `${base}/resources` },
    { url: `${base}/contact` },
    { url: `${base}/verify-card` }
  ];
}
