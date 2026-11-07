import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../../errors/app.error.js';
import { ErrorCode } from '../../errors/error.code.js';

export class R2StorageService {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (cause) {
      throw new AppError({
        status: 500,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Não foi possível armazenar o arquivo no Cloudflare R2.',
        cause,
      });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (cause) {
      throw new AppError({
        status: 500,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Não foi possível remover o arquivo do Cloudflare R2.',
        cause,
      });
    }
  }

  async getPresignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresInSeconds },
      );
    } catch (cause) {
      throw new AppError({
        status: 500,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Não foi possível gerar a URL temporária do arquivo.',
        cause,
      });
    }
  }
}
