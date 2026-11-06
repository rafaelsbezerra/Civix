import { S3Client } from '@aws-sdk/client-s3';
import { AppError } from '../../errors/app.error.js';
import { ErrorCode } from '../../errors/error.code.js';

export interface R2ClientConfig { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string }
export function createR2Client(config?: R2ClientConfig): { client: S3Client; bucket: string } {
  const value = config ?? {
    endpoint: process.env.R2_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT,
    bucket: process.env.R2_BUCKET ?? process.env.CLOUDFLARE_R2_BUCKET_NAME,
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? process.env.CLOUDFLARE_R2_SECRET_ID,
  };
  if (!value.endpoint || !value.bucket || !value.accessKeyId || !value.secretAccessKey) {
    throw new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, message: 'Armazenamento de imagens indisponível.' });
  }
  return { client: new S3Client({ region: 'auto', endpoint: value.endpoint,
    credentials: { accessKeyId: value.accessKeyId, secretAccessKey: value.secretAccessKey } }), bucket: value.bucket };
}
