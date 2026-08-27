import { cache } from 'react';
import { db } from '@/lib/db';

export type SiteSettings = Record<string, string>;

export const DEFAULT_SETTINGS: SiteSettings = {
  contact_phone: '+233 24 123 4567',
  contact_email: 'info@gacoda.org',
  whatsapp_number: '233241234567',
  address_locality: 'Accra, Ghana',
  announcement_enabled: 'false',
  announcement_text: ''
};

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
