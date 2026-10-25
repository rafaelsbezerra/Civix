import type { CreateImageInput } from '../dtos/storage.image.dto.js';
import type { Image } from '../interfaces/image.row.js';

export interface StorageRepository {
  create(image: CreateImageInput): Promise<Image>;
  getById(id: string): Promise<Image | undefined>;
  getByObjectKey(objectKey: string): Promise<Image | undefined>;
  deleteById(id: string): Promise<void>;
}
