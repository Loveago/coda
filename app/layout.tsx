import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Mr Truth Agency | Move People. Move Business.', template: '%s | Mr Truth Agency' },
  description: 'Mr Truth Agency connects people and businesses to automotive, mobility, driver and vehicle solutions across Ghana.',
  openGraph: { title: 'Mr Truth Agency', description: 'Move people. Move business. Move forward.', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
