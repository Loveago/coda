import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'GACODA | United Drivers. Stronger Voices. Safer Roads.', template: '%s | GACODA' },
  description: 'The collective voice of online drivers in Greater Accra, Ghana.',
  openGraph: { title: 'GACODA', description: 'United drivers. Stronger voices. Safer roads.', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
