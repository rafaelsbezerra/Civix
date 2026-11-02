import { randomUUID } from 'node:crypto';
import type { Image } from '../../interfaces/image.row.js';
import type { StorageRepository } from '../../repositories/storage.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

type StoredImage = Omit<Image, 'created_at'> & { created_at: string };
function toImage(image: StoredImage): Image {
  return { ...image, created_at: new Date(image.created_at) };
}
export const storageJsonRepository: StorageRepository = {
  async create(input) {
    return updateLocalData(data => {
      if (data.images.some(image => image.object_key === input.object_key)) {
        throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'Chave de imagem já cadastrada.' });
      }
      if (!data.users.some(user => String(user.id) === input.uploaded_by)) {
        throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Autor de imagem inválido.' });
      }
      const image = { ...input, id: randomUUID(), created_at: new Date().toISOString() };
      data.images.push(image);
      return toImage(image);
    });
  },
  async getById(id) {
    const image = (await readLocalData()).images.find(image => image.id === id);
    return image ? toImage(image) : undefined;
  },
  async getByObjectKey(key) {
    const image = (await readLocalData()).images.find(image => image.object_key === key);
    return image ? toImage(image) : undefined;
  },
  async deleteById(id) {
    await updateLocalData(data => {
      const image = data.images.find(image => image.id === id);
      if (!image) return;
      if (data.companies.some(company => company.cover_key === image.object_key || company.logo_key === image.object_key)) {
        throw new Error('Não é possível remover uma imagem ainda vinculada.');
      }
      data.images = data.images.filter(image => image.id !== id);
    });
  },
};
