import fs from 'node:fs/promises';
import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const r2Bucket = process.env.R2_BUCKET;
const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2Secret = process.env.R2_SECRET_ACCESS_KEY;
const r2PublicBase = process.env.R2_PUBLIC_BASE_URL;
const localUploadDir = process.env.LOCAL_UPLOAD_DIR || 'uploads';
const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:4000';

const hasR2 = Boolean(r2Bucket && r2Endpoint && r2AccessKey && r2Secret && r2PublicBase);

const s3 = hasR2
  ? new S3Client({
      endpoint: r2Endpoint,
      region: process.env.R2_REGION || 'auto',
      credentials: {
        accessKeyId: r2AccessKey!,
        secretAccessKey: r2Secret!,
      },
    })
  : null;

export function getLocalUploadDir() {
  return localUploadDir;
}

export async function ensureLocalUploadDir() {
  await fs.mkdir(localUploadDir, { recursive: true });
}

export async function uploadImage(params: {
  data: Buffer;
  mimeType: string;
  fileNameHint: string;
}): Promise<{ storageUrl: string; storageKey: string }> {
  const ext = inferExtension(params.mimeType, params.fileNameHint);
  const storageKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  if (hasR2 && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: storageKey,
        Body: params.data,
        ContentType: params.mimeType,
      }),
    );

    return {
      storageKey,
      storageUrl: `${r2PublicBase!.replace(/\/$/, '')}/${storageKey}`,
    };
  }

  await ensureLocalUploadDir();
  const filePath = path.join(localUploadDir, storageKey);
  await fs.writeFile(filePath, params.data);

  return {
    storageKey,
    storageUrl: `${publicBaseUrl.replace(/\/$/, '')}/uploads/${storageKey}`,
  };
}

function inferExtension(mimeType: string, fileNameHint: string): string {
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'image/avif') return 'avif';
  if (mimeType === 'image/jpeg') return 'jpg';

  const fromName = fileNameHint.split('.').pop();
  if (fromName && fromName.length < 8) {
    return fromName.toLowerCase();
  }

  return 'bin';
}
