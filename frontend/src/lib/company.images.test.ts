import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn<typeof fetch>();
const localStorageMock = {
  getItem: vi.fn((): string | null => 'token-imagem-sintetico'),
};

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('Consumidores da API de imagens empresariais', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', 'https://backend.example.test/api/v1');
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', localStorageMock);
    fetchMock.mockReset();
    localStorageMock.getItem.mockReset().mockReturnValue('token-imagem-sintetico');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each(['logo', 'cover'] as const)(
    'envia %s autenticada como multipart sem fixar Content-Type',
    async (purpose) => {
      const companyId = 'empresa-sintetica-42';
      const file = new File(['conteúdo sintético'], 'imagem.webp', {
        type: 'image/webp',
      });
      const result = {
        imageId: 'imagem-sintetica-7',
        target: { module: 'companies', resourceId: companyId, purpose },
      };
      respond({ data: result }, 201);
      const { uploadCompanyImage } = await import('./api');

      expect(await uploadCompanyImage(companyId, purpose, file)).toEqual(result);
      const [url, options] = fetchMock.mock.calls[0];
      const headers = new Headers(options?.headers);

      expect(url).toBe('https://backend.example.test/api/v1/storage/images');
      expect(options?.method).toBe('POST');
      expect(headers.get('Accept')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer token-imagem-sintetico');
      expect(headers.has('Content-Type')).toBe(false);
      expect(options?.body).toBeInstanceOf(FormData);
      const form = options?.body as FormData;
      expect(form.get('file')).toMatchObject({
        name: 'imagem.webp',
        type: 'image/webp',
        size: file.size,
      });
      expect(form.get('module')).toBe('companies');
      expect(form.get('resourceId')).toBe(companyId);
      expect(form.get('purpose')).toBe(purpose);
    },
  );

  it('rejeita upload sem sessão e não realiza a chamada', async () => {
    localStorageMock.getItem.mockReturnValueOnce(null);
    const { ApiError, uploadCompanyImage } = await import('./api');
    const file = new File(['conteúdo sintético'], 'logo.png', { type: 'image/png' });

    await expect(uploadCompanyImage('empresa-1', 'logo', file)).rejects.toMatchObject({
      constructor: ApiError,
      status: 401,
      message: 'Faça login para continuar.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejeita resposta de upload que não corresponde ao destino solicitado', async () => {
    respond({
      data: {
        imageId: 'imagem-sintetica-8',
        target: { module: 'companies', resourceId: 'outra-empresa', purpose: 'logo' },
      },
    });
    const { uploadCompanyImage } = await import('./api');
    const file = new File(['conteúdo sintético'], 'logo.jpg', { type: 'image/jpeg' });

    await expect(uploadCompanyImage('empresa-1', 'logo', file)).rejects.toThrow(
      'A API retornou um upload inválido.',
    );
  });

  it('obtém URL assinada com TTL de cinco minutos e codifica o identificador', async () => {
    const signedUrl = 'https://images.example.test/signed-image';
    respond({ data: { url: signedUrl, expiresInSeconds: 300 } });
    const { getCompanyImageUrl } = await import('./api');

    expect(await getCompanyImageUrl('imagem / sintética')).toBe(signedUrl);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://backend.example.test/api/v1/storage/images/imagem%20%2F%20sint%C3%A9tica/url',
    );
    expect(options?.method).toBeUndefined();
    expect(new Headers(options?.headers).get('Accept')).toBe('application/json');
    expect(new Headers(options?.headers).has('Authorization')).toBe(false);
  });

  it('rejeita URL assinada sem TTL contratual e preserva erro HTTP', async () => {
    respond({
      data: { url: 'https://images.example.test/signed-image', expiresInSeconds: 60 },
    });
    const { ApiError, getCompanyImageUrl } = await import('./api');

    await expect(getCompanyImageUrl('imagem-1')).rejects.toThrow(
      'A API retornou uma URL de imagem inválida.',
    );
    respond({ message: 'Imagem indisponível.', status: 503 }, 503);
    const error = await getCompanyImageUrl('imagem-2').catch((failure) => failure);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 503, message: 'Imagem indisponível.' });
  });
});
