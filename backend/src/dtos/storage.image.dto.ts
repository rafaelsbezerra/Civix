import type { UserId } from '../entities/user.entity.js';
import type { Image } from '../interfaces/image.row.js';

export interface ImageTarget {
  module: 'companies';
  resourceId: string;
  purpose: 'cover' | 'logo';
}

/** Identidade verificada pelo middleware; não aceitar esses campos do multipart. */
export interface StorageActor {
  userId: UserId;
  role: string;
}

/** Arquivo extraído pelo parser; conteúdo, tipo e tamanho ainda exigem validação. */
export interface ImageUploadFile {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}

export interface UploadImageInput extends ImageTarget {
  file: ImageUploadFile;
}

export type CreateImageInput = Omit<Image, 'id' | 'created_at'>;

/** Contratos futuros; os services desta estrutura ainda não retornam esses DTOs. */
export interface UploadImageResult {
  imageId: string;
  target: ImageTarget;
}

export interface PresignedImageUrlResult {
  url: string;
  expiresInSeconds: number;
}
