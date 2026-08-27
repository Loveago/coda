import { readFile } from 'node:fs/promises';
import path from 'node:path';

const contentTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf'
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const name = path.basename((await params).file);
  const extension = name.split('.').pop()?.toLowerCase() || '';
  const contentType = contentTypes[extension];
  if (!contentType) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(path.join(process.cwd(), 'public', 'uploads', name));
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
