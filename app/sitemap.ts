export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    { url: base },
    { url: `${base}/about` },
    { url: `${base}/membership` },
    { url: `${base}/membership-status` },
    { url: `${base}/news` },
    { url: `${base}/gallery` },
    { url: `${base}/resources` },
    { url: `${base}/contact` }
  ];
}
