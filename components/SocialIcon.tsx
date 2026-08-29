import type { SocialPlatformKey } from '@/lib/settings';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

/**
 * Icon for each supported social platform. lucide-react ships most brand
 * glyphs but not TikTok, so that one is inlined to keep the set complete.
 */
const icons = {
  facebook: Facebook,
  x: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin
} as const;

export default function SocialIcon({ platform, size = 13 }: { platform: SocialPlatformKey; size?: number }) {
  const Icon = icons[platform as keyof typeof icons];
  if (Icon) return <Icon size={size} />;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden focusable="false">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.85-2.48V9.77a5.76 5.76 0 0 0-1.09-.1 5.73 5.73 0 1 0 5.73 5.73V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-2.94-1.48Z" />
    </svg>
  );
}
