import { cache } from 'react';
import { db } from '@/lib/db';

export type SiteSettings = Record<string, string>;

/**
 * Social profiles shown in the site header. Each platform is stored as its own
 * `social_<key>` row in the SiteSetting table so admins can edit them from
 * /admin/settings/social without a schema change. An empty value hides the
 * icon entirely.
 */
export const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'tiktok', label: 'TikTok' }
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]['key'];

export type SocialLink = { key: SocialPlatformKey; label: string; url: string };

export const SOCIAL_SETTING_KEYS = SOCIAL_PLATFORMS.map((platform) => `social_${platform.key}`);

export const DEFAULT_SETTINGS: SiteSettings = {
  contact_phone: '+233 24 123 4567',
  contact_email: 'info@mrtruthagency.com',
  whatsapp_number: '233241234567',
  address_locality: 'Accra, Ghana',
  announcement_enabled: 'false',
  announcement_text: '',
  social_facebook: 'https://facebook.com',
  social_x: 'https://twitter.com',
  social_instagram: 'https://instagram.com',
  social_youtube: '',
  social_linkedin: '',
  social_tiktok: ''
};

/** Platforms that currently have a URL configured, in display order. */
export function socialLinks(settings: SiteSettings): SocialLink[] {
  return SOCIAL_PLATFORMS.map((platform) => ({
    key: platform.key,
    label: platform.label,
    url: (settings[`social_${platform.key}`] ?? '').trim()
  })).filter((link) => link.url.length > 0);
}

/**
 * Accept what an admin typed and make it a usable absolute URL. Bare handles
 * like "facebook.com/mrtruthagency" get https:// prepended; anything that cannot be
 * parsed is rejected so we never render a broken or javascript: link.
 */
export function normalizeSocialUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return '';
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function announcementKey(text: string) {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: Object.keys(DEFAULT_SETTINGS) } }
    });
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
});
