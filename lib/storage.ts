import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};
const ALLOWED_DOCUMENTS: Record<string, string> = {
  'application/pdf': 'pdf'
};

export type UploadResult = {
  url: string;
  driver: 'vercel-blob' | 'local';
  mimeType: string;
  size: number;
};

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES[file.type]) return 'Only JPG, PNG, WebP or GIF images are allowed.';
  if (file.size > MAX_SIZE) return 'Images must be 5 MB or smaller.';
  return null;
}

export function validateDocument(file: File): string | null {
  if (!ALLOWED_DOCUMENTS[file.type]) return 'Only PDF documents are allowed.';
  if (file.size > MAX_DOCUMENT_SIZE) return 'PDF files must be 15 MB or smaller.';
  return null;
}

async function uploadToVercelBlob(file: File, token: string, extension: string): Promise<UploadResult> {
  const pathname = `mr-truth-agency/${randomUUID()}.${extension}`;
  const response = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-content-type': file.type,
      'Content-Type': 'application/octet-stream'
    },
    body: Buffer.from(await file.arrayBuffer())
  });
  if (!response.ok) throw new Error('Blob storage rejected the upload.');
  const result = (await response.json()) as { url: string };
  return { url: result.url, driver: 'vercel-blob', mimeType: file.type, size: file.size };
}

async function uploadToLocalDisk(file: File, extension: string): Promise<UploadResult> {
  const directory = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${filename}`, driver: 'local', mimeType: file.type, size: file.size };
}

async function store(file: File, extensionMap: Record<string, string>): Promise<UploadResult> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    try {
      return await uploadToVercelBlob(file, blobToken, extensionMap[file.type]);
    } catch {
      // fall through to local disk so uploads keep working
    }
  }
  return uploadToLocalDisk(file, extensionMap[file.type]);
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const invalid = validateImage(file);
  if (invalid) throw new Error(invalid);
  return store(file, ALLOWED_TYPES);
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const invalid = validateDocument(file);
  if (invalid) throw new Error(invalid);
  return store(file, ALLOWED_DOCUMENTS);
}
