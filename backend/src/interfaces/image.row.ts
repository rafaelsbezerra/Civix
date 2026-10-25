export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp';

/** Linha PostgreSQL de images; created_at ainda não foi serializado para HTTP. */
export interface Image {
  id: string;
  object_key: string;
  original_name: string;
  mime_type: ImageMimeType;
  size_bytes: number;
  module: string;
  resource_id: string;
  purpose: string;
  uploaded_by: string;
  created_at: Date;
}
