import type { StorageRepository } from '../../repositories/storage.repository.js';
import type { CreateImageInput } from '../../dtos/storage.image.dto.js';
import type { Image } from '../../interfaces/image.row.js';
import { getPrisma } from '../../shared/config/prisma.js';

function toImage(row: Omit<Image, 'mime_type'> & { mime_type: string }): Image {
  return { ...row, mime_type: row.mime_type as Image['mime_type'] };
}

export const storagePostgresRepository: StorageRepository = {
  async create(image) {
    return toImage(await getPrisma().images.create({ data: image }));
  },
  async getById(id) {
    const image = await getPrisma().images.findUnique({ where: { id } });
    return image ? toImage(image) : undefined;
  },
  async getByObjectKey(objectKey) {
    const image = await getPrisma().images.findUnique({
      where: { object_key: objectKey },
    });
    return image ? toImage(image) : undefined;
  },
  async deleteById(id) {
    await getPrisma().images.deleteMany({ where: { id } });
  },
};
