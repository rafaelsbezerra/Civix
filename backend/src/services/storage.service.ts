import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import { z } from 'zod';
import type { Image, ImageMimeType } from '../interfaces/image.row.js';
import type {
  ImageTarget,
  StorageActor,
  UploadImageInput,
  UploadImageResult,
  PresignedImageUrlResult,
} from '../dtos/storage.image.dto.js';
import { companyRepository } from '../persistence/company.repository.js';
import { storageRepository } from '../persistence/storage.repository.js';
import * as companyService from './company.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { logger } from '../shared/logging/log.context.js';
import { getAuthenticatedUser } from './user.service.js';
import { imageObjectStore } from '../shared/integrations/cloudflare/storage.provider.js';

export const MAX_IMAGE_BYTES = 10000000;
export const IMAGE_URL_SECONDS = 300;
const targetSchema = z
  .object({
    module: z.literal('companies'),
    resourceId: z.string().uuid(),
    purpose: z.literal('cover'),
  })
  .strict();
const allowedMime = ['image/png', 'image/jpeg', 'image/webp'];

export async function validateImageTargetAccess(
  target: ImageTarget,
  actor: StorageActor,
): Promise<void> {
  if (!targetSchema.safeParse(target).success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Destino de imagem inválido. Apenas capa de empresa é permitida.',
    });
  }
  const user = await getAuthenticatedUser(actor.userId);
  if (
    user.role !== actor.role ||
    (user.role !== 'super_admin' &&
      (user.role !== 'admin_empresa' || user.company_id !== target.resourceId))
  ) {
    throw new AppError({
      status: 403,
      code: ErrorCode.FORBIDDEN,
      message: 'Sem permissão para alterar a capa desta empresa.',
    });
  }
  const company = await companyRepository.getById(target.resourceId);
  if (!company || company.status === 'inativo' || company.deleted_at) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'Empresa não encontrada.',
    });
  }
}

export async function updateTargetImageKey(
  target: ImageTarget,
  key: string,
  expectedKey: string | null,
): Promise<void> {
  if (target.module !== 'companies' || target.purpose !== 'cover') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Destino não suportado.',
    });
  }
  await companyService.updateCompanyCoverKey(target.resourceId, key, expectedKey);
}

// A API nunca reutiliza uma chave antiga: toda substituição recebe UUID novo.
export async function deleteReplacedImage(image: Image): Promise<void> {
  if (await companyRepository.isImageKeyReferenced(image.object_key)) {
    return;
  }
  await imageObjectStore.delete(image.object_key);
  await storageRepository.deleteById(image.id);
}

function recordCleanupFailure(error: unknown): void {
  try {
    logger().error({
      event: 'storage.cleanup.failed',
      module: 'storage',
      message: 'Limpeza de imagem pendente; preservar a referência vigente.',
      error,
    });
  } catch {
    // Falha de logging não substitui o erro da operação ou uma capa confirmada.
  }
}

export async function uploadImage(
  input: UploadImageInput,
  actor: StorageActor,
): Promise<UploadImageResult> {
  const target = {
    module: input.module,
    resourceId: input.resourceId,
    purpose: input.purpose,
  };
  await validateImageTargetAccess(target, actor);
  const file = input.file;
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    !file.buffer.length ||
    !file.originalName?.trim()
  ) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Arquivo de imagem obrigatório.',
    });
  }
  if (file.buffer.length > MAX_IMAGE_BYTES) {
    throw new AppError({
      status: 413,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'A imagem excede o limite de 10 MB.',
    });
  }
  let detected;
  try {
    detected = await fileTypeFromBuffer(file.buffer);
  } catch {
    detected = undefined;
  }
  if (
    !detected ||
    !allowedMime.includes(detected.mime) ||
    file.mimeType !== detected.mime ||
    file.sizeBytes !== file.buffer.length
  ) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Imagem inválida. Envie PNG, JPG ou WEBP com tipo correto.',
    });
  }
  // Releitura após validação: a referência anterior participa do compare-and-swap.
  const company = await companyService.getCompanyById(target.resourceId);
  const previousKey = company.cover_key ?? null;
  const key = 'companies/' + company.id + '/cover/' + randomUUID() + '.' + detected.ext;
  let image: Image | undefined;
  try {
    await imageObjectStore.upload(key, file.buffer, detected.mime);
    image = await storageRepository.create({
      object_key: key,
      original_name: file.originalName,
      mime_type: detected.mime as ImageMimeType,
      size_bytes: file.buffer.length,
      module: target.module,
      resource_id: target.resourceId,
      purpose: target.purpose,
      uploaded_by: String(actor.userId),
    });
    await validateImageTargetAccess(target, actor);
    await updateTargetImageKey(target, key, previousKey);
  } catch (error) {
    try {
      if (!(await companyRepository.isImageKeyReferenced(key))) {
        await imageObjectStore.delete(key);
        if (image) {
          await storageRepository.deleteById(image.id);
        }
      }
    } catch (cleanupError) {
      recordCleanupFailure(cleanupError);
    }
    throw error;
  }
  if (previousKey) {
    try {
      const previous = await storageRepository.getByObjectKey(previousKey);
      if (previous) {
        await deleteReplacedImage(previous);
      }
    } catch (error) {
      recordCleanupFailure(error);
    }
  }
  try {
    logger().info({
      event: 'storage.cover.updated',
      module: 'storage',
      message: 'Capa da empresa atualizada.',
      context: { userId: actor.userId, companyId: company.id },
    });
  } catch {
    // A atualização persistida já foi confirmada.
  }
  return { imageId: image.id, target };
}

export async function getPresignedImageUrl(
  imageId: string,
): Promise<PresignedImageUrlResult> {
  if (!z.string().uuid().safeParse(imageId).success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'ID de imagem inválido.',
    });
  }
  const image = await storageRepository.getById(imageId);
  const company =
    image?.module === 'companies' && image.purpose === 'cover'
      ? await companyRepository.getById(image.resource_id)
      : undefined;
  if (
    !image ||
    !company ||
    company.cover_key !== image.object_key ||
    company.status === 'inativo' ||
    company.deleted_at
  ) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'Capa não encontrada.',
    });
  }
  return {
    url: await imageObjectStore.getPresignedUrl(image.object_key, IMAGE_URL_SECONDS),
    expiresInSeconds: IMAGE_URL_SECONDS,
  };
}
