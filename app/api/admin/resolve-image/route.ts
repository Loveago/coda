import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { rateLimit, requestAddress } from '@/lib/rate-limit';

// Resolves page-style image links (e.g. an ImgBB share page such as
// https://ibb.co/Q3jGgKXK) into the direct image file URL they point at,
// so they can actually be rendered in an <img> tag.

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 400_000;
const MAX_BODY_BYTES = 5_000_000;

function decodeEntities(value: string) {
  return value
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

function extractDirectImage(html: string): string | null {
  const tagPatterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]*>/i,
    /<link[^>]+rel=["']image_src["'][^>]*>/i
  ];
  for (const pattern of tagPatterns) {
    const tag = html.match(pattern)?.[0];
    if (!tag) continue;
    const value = tag.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (value && value.trim()) return decodeEntities(value.trim());
  }
  return null;
}

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (host === 'localhost' || host === '::1' || host === '::') return true;
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (/^127(\.\d{1,3}){3}$/.test(host)) return true;
  if (/^10(\.\d{1,3}){3}$/.test(host)) return true;
  if (/^192\.168(\.\d{1,3}){2}$/.test(host)) return true;
  if (/^169\.254(\.\d{1,3}){2}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}$/.test(host)) return true;
  if (/^(f[cd]|fe80)/.test(host)) return true;
  return false;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limit = rateLimit(`resolve-image:${requestAddress(request)}`, 30);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });

  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const raw = typeof body.url === 'string' ? body.url.trim() : '';
  if (!raw) return NextResponse.json({ error: 'No link was provided.' }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') throw new Error('bad protocol');
  } catch {
    return NextResponse.json({ error: 'Enter a valid http(s) link.' }, { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return NextResponse.json({ error: 'That host is not allowed.' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GACODLinkResolver/1.0)',
        Accept: 'image/*,text/html;q=0.8,*/*;q=0.5'
      }
    });
    if (!response.ok) {
      return NextResponse.json({ error: `The link responded with status ${response.status}.` }, { status: 422 });
    }

    const finalUrl = response.url || target.toString();

    // Already a direct image – nothing to resolve.
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.startsWith('image/')) {
      return NextResponse.json({ url: finalUrl, resolved: false });
    }

    const declaredLength = Number(response.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ url: finalUrl, resolved: false });
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const candidate = extractDirectImage(html);
    if (!candidate) return NextResponse.json({ url: finalUrl, resolved: false });

    let absolute: string;
    try {
      absolute = new URL(candidate, finalUrl).toString();
    } catch {
      return NextResponse.json({ url: finalUrl, resolved: false });
    }

    try {
      const parsed = new URL(absolute);
      if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || isBlockedHost(parsed.hostname)) {
        throw new Error('blocked');
      }
    } catch {
      return NextResponse.json({ url: finalUrl, resolved: false });
    }

    return NextResponse.json({ url: absolute, resolved: true });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
    return NextResponse.json(
      { error: timedOut ? 'The link took too long to respond.' : 'That link could not be fetched.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
