import { createHmac, timingSafeEqual } from 'node:crypto';

const PREVIEW_TTL = 60 * 10;

function previewSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is required in production.');
  return value || 'development-only-change-me';
}

export function createPreviewToken(articleId: string) {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const payload = `${articleId}.${issuedAt}`;
  const signature = createHmac('sha256', previewSecret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyPreviewToken(token: string, articleId: string) {
  try {
    const [tokenArticleId, issuedAt, signature] = token.split('.');
    if (tokenArticleId !== articleId || !issuedAt || !signature) return false;
    const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
    if (!Number.isFinite(age) || age < 0 || age > PREVIEW_TTL) return false;
    const expected = createHmac('sha256', previewSecret()).update(`${tokenArticleId}.${issuedAt}`).digest('hex');
    const actualBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
