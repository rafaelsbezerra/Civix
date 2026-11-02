import type { Image } from '../../interfaces/image.row.js';
import type { StorageRepository } from '../../repositories/storage.repository.js';
import { db } from '../../shared/config/data.js';

export const storagePostgresRepository: StorageRepository = {
  async create(image) {
    return (await db.query<Image>(
      `INSERT INTO images (object_key, original_name, mime_type, size_bytes, module, resource_id, purpose, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [image.object_key, image.original_name, image.mime_type, image.size_bytes, image.module, image.resource_id, image.purpose, image.uploaded_by],
    )).rows[0];
  },
  async getById(id) {
    return (await db.query<Image>('SELECT * FROM images WHERE id = $1', [id])).rows[0];
  },
  async getByObjectKey(key) {
    return (await db.query<Image>('SELECT * FROM images WHERE object_key = $1', [key])).rows[0];
  },
  async deleteById(id) {
    await db.query('DELETE FROM images WHERE id = $1', [id]);
  },
};
