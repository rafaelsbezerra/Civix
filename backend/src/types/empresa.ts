/**
 * Interface para a entidade Empresa
 * Represente uma empresa no catálogo
 */
export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  descricao: string;
  descricaoDetalhada: string;
  categoria: string;
  logo?: string;
  cidade: string;
  estado: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  status: 'ativo' | 'inativo' | 'verificado';
  dataCadastro: string;
  verificado: boolean;
  tamanho: 'pequena' | 'media' | 'grande';
  descritivo?: string;
  tone?: string; // Para ui styling
}

/**
 * Response padrão da API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Response para listagem de empresas
 */
export interface EmpresasListResponse extends ApiResponse<Empresa[]> {}

/**
 * Response para detalhes de uma empresa
 */
export interface EmpresaDetailResponse extends ApiResponse<Empresa> {}
