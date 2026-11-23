export interface SuccessResponse<T, M = never> {
  data: T;
  meta?: M;
}

export function createSuccessResponse<T>(data: T): SuccessResponse<T>;
export function createSuccessResponse<T, M>(data: T, meta: M): SuccessResponse<T, M>;
export function createSuccessResponse<T, M>(data: T, meta?: M): SuccessResponse<T, M> {
  return meta === undefined ? { data } : { data, meta };
}

export interface ResponseWriter {
  status(code: number): ResponseWriter;
  json(body: unknown): unknown;
  end(): unknown;
}

export function sendSuccess<T, M>(
  response: ResponseWriter,
  data: T,
  meta?: M,
): unknown {
  return response.status(200).json(createSuccessResponse(data, meta));
}

export function sendCreated<T>(response: ResponseWriter, data: T): unknown {
  return response.status(201).json(createSuccessResponse(data));
}

export function sendNoContent(response: ResponseWriter): unknown {
  return response.status(204).end();
}
