import { createR2Client } from './r2.client.js';
import { R2StorageService } from './r2.service.js';

let storage: R2StorageService | undefined;
function getStorage(): R2StorageService {
  if (!storage) {
    const { client, bucket } = createR2Client();
    storage = new R2StorageService(client, bucket);
  }
  return storage;
}
export const imageObjectStore = {
  upload: (key: string, body: Buffer, mime: string) => getStorage().upload(key, body, mime),
  delete: (key: string) => getStorage().delete(key),
  getPresignedUrl: (key: string, seconds: number) => getStorage().getPresignedUrl(key, seconds),
};
