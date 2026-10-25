import type { Image } from '../interfaces/image.row.js';
import type { ImageTarget, StorageActor, UploadImageInput } from '../dtos/storage.image.dto.js';

export async function uploadImage(input: UploadImageInput, actor: StorageActor): Promise<void> { }

export async function getPresignedImageUrl(imageId: string): Promise<void> { }

export async function validateImageTargetAccess(target: ImageTarget, _ctor: StorageActor): Promise<void> { }

export async function updateTargetImageKey(target: ImageTarget, objectKey: string): Promise<void> { }

export async function deleteReplacedImage(image: Image): Promise<void> { }
