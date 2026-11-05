import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const postmanDirectory = join(scriptDirectory, '..')
const collectionDirectory = join(postmanDirectory, 'collections', 'civix-api')
const importDirectory = join(postmanDirectory, 'import')
const environmentDirectory = join(postmanDirectory, 'environments')

const companyPayload = {
  nome: '{{companyName}}',
  cnpj: '{{companyCnpj}}',
  descricao: 'Empresa criada pelo fluxo do Postman.',
  descricao_detalhada: 'Cadastro de validação compartilhado pela equipe Civix.',
  categoria: '{{category}}',
  cidade: 'Fortaleza',
  estado: '{{state}}',
  tamanho: '{{companySize}}',
  email: '{{companyEmail}}',
  endereco: null,
  telefone: null,
  website: null,
  whatsapp: null,
  logo: null,
  descritivo: null,
  tone: 'blue',
  planId: '{{planId}}',
}

const planPayload = {
  name: '{{planName}}',
  slug: '{{planSlug}}',
  description: 'Plano criado pelo fluxo do Postman.',
  price: '39.90',
  billingPeriod: 'monthly',
  features: ['Recurso de validação'],
  limits: {
    teamMembers: 5,
    automationEnabled: true,
  },
  isFeatured: false,
  isActive: true,
  displayOrder: 100,
}

const request = (folder, file, name, method, path, options = {}) => ({
  folder,
  file,
  name,
  method,
  path,
  expectedStatus: options.expectedStatus ?? 200,
  auth: options.auth,
  body: options.body,
  formdata: options.formdata,
  query: options.query ?? [],
  write: options.write ?? false,
  destructive: options.destructive ?? false,
  guardFlags: options.guardFlags ?? [],
  errorResponse: options.errorResponse ?? false,
  setup: options.setup,
  requiredVariables: options.requiredVariables ?? [],
  capture: options.capture ?? {},
  description: options.description ?? '',
})

export const requests = [
  request(['00-system'], 'health-check', 'Health check', 'GET', '/', {
    auth: 'noauth',
    description: 'Confirma que o processo HTTP da API está respondendo.',
  }),

  request(['10-authentication', 'session'], 'login-super-admin', 'Login superadmin', 'POST', '/api/v1/users/login', {
    auth: 'noauth',
    body: { email: '{{superAdminEmail}}', password: '{{superAdminPassword}}', role: 'super_admin' },
    description: 'Cria a sessão no cookie HttpOnly sessao. O JSON atual não devolve o JWT.',
    setup: 'login',
    requiredVariables: ['superAdminEmail', 'superAdminPassword'],
  }),
  request(['60-company-admin-flow'], 'login-company-admin', 'Login admin da empresa', 'POST', '/api/v1/users/login', {
    auth: 'noauth',
    body: { email: '{{companyAdminEmail}}', password: '{{companyAdminPassword}}', role: 'admin_empresa' },
    description: 'Cria uma sessão de admin_empresa para testar seleção de plano e upload da própria empresa.',
    setup: 'login',
    guardFlags: ['allowRoleSwitch'],
    requiredVariables: ['companyAdminEmail', 'companyAdminPassword'],
  }),
  request(['65-attendant-flow'], 'login-attendant', 'Login atendente', 'POST', '/api/v1/users/login', {
    auth: 'noauth',
    body: { email: '{{attendantEmail}}', password: '{{attendantPassword}}', role: 'atendente' },
    description: 'Cria uma sessão de atendente.',
    setup: 'login',
    guardFlags: ['allowRoleSwitch'],
    requiredVariables: ['attendantEmail', 'attendantPassword'],
  }),
  request(['10-authentication', 'password'], 'forgot-password', 'Solicitar recuperação de senha', 'POST', '/api/v1/users/forgot-password', {
    auth: 'noauth',
    body: { email: '{{passwordRecoveryEmail}}' },
    write: true,
    guardFlags: ['allowEmails'],
    requiredVariables: ['passwordRecoveryEmail'],
    description: 'Resposta neutra; pode disparar e-mail se o usuário existir.',
  }),
  request(['10-authentication', 'password'], 'forgot-password-alias', 'Solicitar recuperação de senha - alias PT-BR', 'POST', '/api/v1/users/esqueci-senha', {
    auth: 'noauth',
    body: { email: '{{passwordRecoveryEmail}}' },
    write: true,
    guardFlags: ['allowEmails'],
    requiredVariables: ['passwordRecoveryEmail'],
    description: 'Alias em português da recuperação de senha.',
  }),
  request(['10-authentication', 'password'], 'reset-password', 'Redefinir senha', 'POST', '/api/v1/users/reset-password', {
    auth: 'noauth',
    body: { token: '{{resetToken}}', password: '{{newPassword}}' },
    write: true,
    guardFlags: ['allowIdentityWrites'],
    requiredVariables: ['resetToken', 'newPassword'],
    description: 'Consome o token recebido pelo canal de e-mail e invalida o token após o uso.',
  }),
  request(['10-authentication', 'password'], 'reset-password-alias', 'Redefinir senha - alias PT-BR', 'POST', '/api/v1/users/redefinir-senha', {
    auth: 'noauth',
    body: { token: '{{resetToken}}', password: '{{newPassword}}' },
    write: true,
    guardFlags: ['allowIdentityWrites'],
    requiredVariables: ['resetToken', 'newPassword'],
    description: 'Alias em português da redefinição de senha.',
  }),
  request(['10-authentication', 'first-access'], 'validate-invite-token', 'Validar token de convite', 'GET', '/api/v1/auth/auth/validate-token', {
    auth: 'noauth',
    query: [{ key: 'token', value: '{{inviteToken}}' }],
    requiredVariables: ['inviteToken'],
    description: 'Usa o path realmente montado, com o prefixo auth duplicado no código atual.',
  }),
  request(['10-authentication', 'first-access'], 'first-access', 'Definir senha no primeiro acesso', 'POST', '/api/v1/auth/auth/first-access', {
    auth: 'noauth',
    body: { token: '{{inviteToken}}', password: '{{newPassword}}' },
    write: true,
    guardFlags: ['allowIdentityWrites'],
    requiredVariables: ['inviteToken', 'newPassword'],
    description: 'Ativa uma conta convidada e define sua primeira senha.',
  }),
  request(['10-authentication', 'first-access'], 'resend-invite', 'Reenviar convite', 'POST', '/api/v1/auth/auth/resend-invite-email', {
    auth: 'noauth',
    body: { email: '{{inviteEmail}}' },
    write: true,
    guardFlags: ['allowEmails'],
    requiredVariables: ['inviteEmail'],
    description: 'Resposta neutra; pode disparar e-mail. Usa o path realmente montado.',
  }),

  request(['20-public-catalog', 'plans'], 'list-active-plans', 'Listar planos ativos', 'GET', '/api/v1/plans', {
    auth: 'noauth',
    description: 'Lista os planos disponíveis no catálogo. Copie conscientemente o ID desejado para planId.',
  }),
  request(['20-public-catalog', 'companies'], 'list-companies', 'Listar empresas públicas', 'GET', '/api/v1/empresas', {
    auth: 'noauth',
    description: 'Lista empresas disponíveis publicamente.',
  }),
  request(['20-public-catalog', 'companies'], 'list-verified-companies', 'Listar empresas verificadas', 'GET', '/api/v1/empresas/verificadas/todas', {
    auth: 'noauth',
    description: 'Lista somente empresas verificadas e publicamente disponíveis.',
  }),
  request(['20-public-catalog', 'companies'], 'search-companies', 'Buscar empresas', 'GET', '/api/v1/empresas/buscar', {
    auth: 'noauth',
    query: [{ key: 'q', value: '{{searchTerm}}' }],
    description: 'Busca empresas pelo termo obrigatório q.',
  }),
  request(['20-public-catalog', 'companies'], 'companies-by-category', 'Filtrar empresas por categoria', 'GET', '/api/v1/empresas/categoria/{{category}}', {
    auth: 'noauth',
    description: 'Filtra empresas públicas por categoria.',
  }),
  request(['20-public-catalog', 'companies'], 'companies-by-state', 'Filtrar empresas por estado', 'GET', '/api/v1/empresas/estado/{{state}}', {
    auth: 'noauth',
    description: 'Filtra empresas públicas por estado.',
  }),
  request(['20-public-catalog', 'companies'], 'companies-by-size', 'Filtrar empresas por tamanho', 'GET', '/api/v1/empresas/tamanho/{{companySize}}', {
    auth: 'noauth',
    description: 'Aceita pequena, media ou grande.',
  }),
  request(['20-public-catalog', 'companies'], 'get-company', 'Consultar empresa pública', 'GET', '/api/v1/empresas/{{companyId}}', {
    auth: 'noauth',
    description: 'Consulta uma empresa ativa e não arquivada.',
  }),

  request(['30-account', 'profile'], 'get-profile', 'Consultar perfil', 'GET', '/api/v1/users/profile', {
    description: 'Retorna o usuário autenticado e suas permissões atuais.',
  }),
  request(['80-final-account'], 'update-profile', 'Atualizar perfil', 'PUT', '/api/v1/users/profile', {
    body: { name: '{{profileName}}', email: '{{profileEmail}}' },
    write: true,
    guardFlags: ['allowProfileUpdate'],
    requiredVariables: ['profileName', 'profileEmail'],
    description: 'Alterar o e-mail exige novo login; execute ao final do fluxo autenticado.',
  }),
  request(['30-account', 'profile'], 'authenticated-home', 'Validar acesso autenticado', 'POST', '/api/v1/users/home', {
    description: 'Retorna o ID e o papel reconhecidos pelo middleware de autenticação.',
  }),
  request(['60-company-admin-flow'], 'select-company-plan', 'Selecionar plano da empresa', 'POST', '/api/v1/plans/selection', {
    body: { planId: '{{planId}}' },
    write: true,
    guardFlags: ['allowAdministrativeWrites', 'allowRoleSwitch'],
    requiredVariables: ['planId'],
    description: 'Exige uma sessão admin_empresa.',
  }),
  request(['30-account', 'companies'], 'create-company-public-prefix', 'Cadastrar empresa pelo prefixo empresas', 'POST', '/api/v1/empresas', {
    body: { ...companyPayload, operationId: '{{companyOperationId}}' },
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    setup: 'company',
    requiredVariables: ['planId'],
    capture: { companyId: 'data.company.id', initialSaleId: 'data.sale.id' },
    expectedStatus: 201,
    description: 'Apesar do prefixo público, exige superadmin e cria uma venda inicial.',
  }),

  request(['40-storage'], 'upload-company-cover', 'Enviar capa da empresa', 'POST', '/api/v1/storage/images', {
    formdata: [
      { key: 'file', type: 'file', src: '{{imageFilePath}}', contentType: 'image/png' },
      { key: 'module', type: 'text', value: 'companies' },
      { key: 'resourceId', type: 'text', value: '{{companyId}}' },
      { key: 'purpose', type: 'text', value: 'cover' },
    ],
    write: true,
    guardFlags: ['allowStorage'],
    requiredVariables: ['companyId', 'imageFilePath'],
    capture: { imageId: 'data.imageId' },
    expectedStatus: 201,
    description: 'Aceita PNG, JPG ou WEBP real, com no máximo 10 MB.',
  }),
  request(['40-storage'], 'get-company-cover-url', 'Gerar URL assinada da capa', 'GET', '/api/v1/storage/images/{{imageId}}/url', {
    auth: 'noauth',
    description: 'Retorna uma URL pública válida por 300 segundos para a capa vigente.',
  }),

  request(['50-platform', 'plans'], 'list-platform-plans', 'Listar todos os planos administrativos', 'GET', '/api/v1/platform/plans', {
    description: 'Lista planos ativos e inativos para o superadmin.',
  }),
  request(['50-platform', 'plans'], 'get-platform-plan', 'Consultar plano administrativo', 'GET', '/api/v1/platform/plans/{{planId}}', {
    description: 'Consulta um plano pelo identificador.',
  }),
  request(['50-platform', 'plans'], 'create-platform-plan', 'Criar plano', 'POST', '/api/v1/platform/plans', {
    body: planPayload,
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    setup: 'plan',
    capture: { planId: 'data.id' },
    expectedStatus: 201,
    description: 'Cria um plano com preço positivo em BRL.',
  }),
  request(['50-platform', 'plans'], 'update-platform-plan', 'Editar plano', 'PUT', '/api/v1/platform/plans/{{planId}}', {
    body: planPayload,
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    setup: 'plan',
    description: 'Substitui os campos editáveis do plano.',
  }),
  request(['50-platform', 'plans'], 'activate-platform-plan', 'Ativar ou desativar plano', 'POST', '/api/v1/platform/plans/{{planId}}/activation', {
    body: { active: true },
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Altere active para false para desativar o plano.',
  }),

  request(['50-platform', 'companies'], 'list-platform-companies', 'Listar empresas administrativas', 'GET', '/api/v1/platform/companies', {
    query: [{ key: 'page', value: '{{page}}' }, { key: 'limit', value: '{{limit}}' }],
    description: 'Filtros opcionais: q, status e planId. Retorna paginação em meta.',
  }),
  request(['50-platform', 'companies'], 'get-platform-company', 'Consultar empresa administrativa', 'GET', '/api/v1/platform/companies/{{companyId}}', {
    description: 'Consulta empresa ativa, inativa ou arquivada.',
  }),
  request(['50-platform', 'companies'], 'create-platform-company', 'Criar empresa e venda inicial', 'POST', '/api/v1/platform/companies', {
    body: { ...companyPayload, operationId: '{{companyOperationId}}' },
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    setup: 'company',
    requiredVariables: ['planId'],
    capture: { companyId: 'data.company.id', initialSaleId: 'data.sale.id' },
    expectedStatus: 201,
    description: 'Cria a empresa e registra a venda automática do plano.',
  }),
  request(['50-platform', 'companies'], 'update-platform-company', 'Editar empresa', 'PUT', '/api/v1/platform/companies/{{companyId}}', {
    body: companyPayload,
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'A troca de plano não cria venda automática.',
  }),
  request(['55-destructive', 'companies'], 'suspend-platform-company', 'Suspender empresa', 'POST', '/api/v1/platform/companies/{{companyId}}/suspension', {
    body: { reason: '{{deactivationReason}}' },
    write: true,
    destructive: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Bloqueia a empresa e seus usuários até reativação explícita.',
  }),
  request(['55-destructive', 'companies'], 'reactivate-platform-company', 'Reativar empresa', 'POST', '/api/v1/platform/companies/{{companyId}}/reactivation', {
    body: {},
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Reativa uma empresa suspensa.',
  }),
  request(['55-destructive', 'companies'], 'archive-platform-company', 'Arquivar empresa', 'DELETE', '/api/v1/platform/companies/{{companyId}}', {
    body: { reason: '{{deactivationReason}}' },
    write: true,
    destructive: true,
    guardFlags: ['allowAdministrativeWrites'],
    expectedStatus: 204,
    description: 'Realiza exclusão lógica e preserva o histórico.',
  }),
  request(['55-destructive', 'companies'], 'restore-platform-company', 'Restaurar empresa arquivada', 'POST', '/api/v1/platform/companies/{{companyId}}/restoration', {
    body: {},
    write: true,
    destructive: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Restaura o registro; a reativação continua explícita.',
  }),

  request(['50-platform', 'company-users'], 'list-company-users', 'Listar usuários da empresa', 'GET', '/api/v1/platform/companies/{{companyId}}/users', {
    query: [{ key: 'page', value: '{{page}}' }, { key: 'limit', value: '{{limit}}' }],
    description: 'Filtros opcionais: q, role e status. Retorna paginação em meta.',
  }),
  request(['50-platform', 'company-users'], 'invite-company-user', 'Convidar usuário da empresa', 'POST', '/api/v1/platform/companies/{{companyId}}/users/invitations', {
    body: { email: '{{managedUserEmail}}', name: '{{managedUserName}}', role: 'atendente' },
    write: true,
    guardFlags: ['allowAdministrativeWrites', 'allowEmails'],
    setup: 'managedUser',
    capture: { companyUserId: 'data.user.id' },
    expectedStatus: 201,
    description: 'Cria convite de admin_empresa ou atendente e pode disparar e-mail.',
  }),
  request(['50-platform', 'company-users'], 'update-company-user', 'Editar usuário da empresa', 'PUT', '/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}', {
    body: { email: '{{managedUserEmail}}', name: '{{managedUserName}}', role: 'atendente' },
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Atualiza nome, e-mail e papel dentro da empresa.',
  }),
  request(['50-platform', 'company-users'], 'suspend-company-user', 'Suspender usuário da empresa', 'POST', '/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}/suspension', {
    body: { reason: '{{deactivationReason}}' },
    write: true,
    destructive: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Revoga as sessões e bloqueia o usuário.',
  }),
  request(['50-platform', 'company-users'], 'reactivate-company-user', 'Reativar usuário da empresa', 'POST', '/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}/reactivation', {
    body: {},
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Reativa o usuário; ele precisa realizar novo login.',
  }),
  request(['50-platform', 'company-users'], 'delete-company-attendant', 'Excluir atendente da empresa', 'DELETE', '/api/v1/platform/companies/{{companyId}}/users/{{companyUserId}}', {
    body: { reason: '{{deactivationReason}}' },
    write: true,
    destructive: true,
    guardFlags: ['allowAdministrativeWrites'],
    expectedStatus: 204,
    description: 'Exclusão lógica permitida somente para atendente.',
  }),

  request(['50-platform', 'administrators'], 'list-administrators', 'Listar superadmins', 'GET', '/api/v1/platform/administrators', {
    query: [{ key: 'page', value: '{{page}}' }, { key: 'limit', value: '{{limit}}' }],
    description: 'Filtros opcionais: q e status. Retorna paginação em meta.',
  }),
  request(['50-platform', 'administrators'], 'invite-administrator', 'Convidar superadmin', 'POST', '/api/v1/platform/administrators/invitations', {
    body: { email: '{{administratorEmail}}', name: '{{administratorName}}' },
    write: true,
    guardFlags: ['allowAdministrativeWrites', 'allowEmails'],
    setup: 'administrator',
    capture: { administratorId: 'data.user.id' },
    expectedStatus: 201,
    description: 'Cria outro superadmin com os mesmos poderes e pode disparar e-mail.',
  }),
  request(['50-platform', 'administrators'], 'update-administrator', 'Editar superadmin', 'PUT', '/api/v1/platform/administrators/{{administratorId}}', {
    body: { email: '{{administratorEmail}}', name: '{{administratorName}}' },
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Atualiza nome e e-mail do superadmin alvo.',
  }),
  request(['50-platform', 'administrators'], 'suspend-administrator', 'Suspender superadmin', 'POST', '/api/v1/platform/administrators/{{administratorId}}/suspension', {
    body: { reason: '{{deactivationReason}}' },
    write: true,
    destructive: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Impede auto-suspensão e suspensão do último superadmin ativo.',
  }),
  request(['50-platform', 'administrators'], 'reactivate-administrator', 'Reativar superadmin', 'POST', '/api/v1/platform/administrators/{{administratorId}}/reactivation', {
    body: {},
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    description: 'Reativa outro superadmin; auto-reativação por esta rota é bloqueada.',
  }),

  request(['50-platform', 'sales'], 'list-platform-sales', 'Listar vendas', 'GET', '/api/v1/platform/sales', {
    query: [{ key: 'page', value: '{{page}}' }, { key: 'limit', value: '{{limit}}' }],
    description: 'Filtros opcionais: companyId, planId, origin, from e to.',
  }),
  request(['50-platform', 'sales'], 'get-platform-sale', 'Consultar venda', 'GET', '/api/v1/platform/sales/{{saleId}}', {
    description: 'Consulta uma venda existente pelo UUID.',
  }),
  request(['50-platform', 'sales'], 'create-manual-sale-by-plan', 'Criar venda manual pelo plano atual', 'POST', '/api/v1/platform/sales', {
    body: {
      companyId: '{{companyId}}',
      operationId: '{{salePlanOperationId}}',
      soldAt: '{{soldAt}}',
      pricingMode: 'company_plan',
      description: 'Venda pelo preço do plano atual.',
    },
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    setup: 'salePlan',
    requiredVariables: ['companyId'],
    capture: { saleId: 'data.sale.id' },
    expectedStatus: 201,
    description: 'Usa o preço do plano vigente da empresa.',
  }),
  request(['50-platform', 'sales'], 'create-manual-sale-by-amount', 'Criar venda manual por valor informado', 'POST', '/api/v1/platform/sales', {
    body: {
      companyId: '{{companyId}}',
      operationId: '{{saleAmountOperationId}}',
      soldAt: '{{soldAt}}',
      pricingMode: 'manual_amount',
      amount: '125.50',
      description: 'Valor manual informado para validação.',
    },
    write: true,
    guardFlags: ['allowAdministrativeWrites'],
    setup: 'saleAmount',
    requiredVariables: ['companyId'],
    capture: { saleId: 'data.sale.id' },
    expectedStatus: 201,
    description: 'Exige valor positivo e descrição/motivo.',
  }),
  request(['50-platform', 'sales'], 'delete-platform-sale', 'Excluir venda', 'DELETE', '/api/v1/platform/sales/{{saleId}}', {
    write: true,
    destructive: true,
    guardFlags: ['allowAdministrativeWrites'],
    expectedStatus: 204,
    description: 'Exclusão definitiva; vendas são imutáveis e não possuem edição.',
  }),

  request(['90-validation-cases'], 'login-missing-email', 'Erro - login sem e-mail', 'POST', '/api/v1/users/login', {
    auth: 'noauth',
    body: { password: 'senha-invalida', role: 'super_admin' },
    expectedStatus: 400,
    errorResponse: true,
    description: 'Valida o contrato de erro para entrada obrigatória ausente.',
  }),
  request(['90-validation-cases'], 'login-client-forbidden', 'Erro - cliente sem área logada', 'POST', '/api/v1/users/login', {
    auth: 'noauth',
    body: { email: 'cliente@example.test', role: 'cliente' },
    expectedStatus: 403,
    errorResponse: true,
    description: 'Valida a regra de negócio que impede sessão para o papel cliente.',
  }),
  request(['90-validation-cases'], 'profile-without-session', 'Erro - perfil sem sessão', 'GET', '/api/v1/users/profile', {
    auth: 'noauth',
    expectedStatus: 401,
    errorResponse: true,
    description: 'Valida a proteção de uma rota autenticada.',
  }),
  request(['90-validation-cases'], 'search-without-term', 'Erro - busca sem termo', 'GET', '/api/v1/empresas/buscar', {
    auth: 'noauth',
    expectedStatus: 400,
    errorResponse: true,
    description: 'Valida a obrigatoriedade da query q.',
  }),
  request(['90-validation-cases'], 'invalid-company-size', 'Erro - tamanho de empresa inválido', 'GET', '/api/v1/empresas/tamanho/invalido', {
    auth: 'noauth',
    expectedStatus: 400,
    errorResponse: true,
    description: 'Valida o enum pequena, media ou grande.',
  }),
  request(['90-validation-cases'], 'invalid-image-id', 'Erro - ID de imagem inválido', 'GET', '/api/v1/storage/images/id-invalido/url', {
    auth: 'noauth',
    expectedStatus: 400,
    errorResponse: true,
    description: 'Valida o UUID obrigatório para imagens.',
  }),
  request(['90-validation-cases'], 'platform-without-session', 'Erro - plataforma sem sessão', 'GET', '/api/v1/platform/companies', {
    auth: 'noauth',
    expectedStatus: 401,
    errorResponse: true,
    description: 'Valida que a plataforma administrativa não é pública.',
  }),
  request(['99-session-cleanup'], 'logout', 'Logout', 'POST', '/api/v1/users/logout', {
    auth: 'noauth',
    description: 'Limpa o cookie e a variável Bearer. Execute ao final do fluxo.',
  }),
]

const folderMetadata = new Map([
  ['00-system', { name: '00 - Sistema', description: 'Disponibilidade básica da API.', auth: 'noauth', order: 1000 }],
  ['10-authentication', { name: '10 - Autenticação', description: 'Sessão, recuperação de senha, convite e primeiro acesso.', auth: 'noauth', order: 2000 }],
  ['20-public-catalog', { name: '20 - Catálogo público', description: 'Consultas públicas de planos e empresas.', auth: 'noauth', order: 3000 }],
  ['30-account', { name: '30 - Conta autenticada', description: 'Perfil, vínculo de plano e cadastro autenticado.', auth: 'inherit', order: 4000 }],
  ['40-storage', { name: '40 - Storage', description: 'Upload autenticado e visualização pública da capa.', auth: 'inherit', order: 5000 }],
  ['50-platform', { name: '50 - Plataforma superadmin', description: 'Administração de empresas, usuários, planos e vendas.', auth: 'inherit', order: 6000 }],
  ['60-company-admin-flow', { name: '60 - Fluxo admin da empresa', description: 'Troca controlada de sessão e seleção de plano como admin_empresa.', auth: 'inherit', order: 7000 }],
  ['65-attendant-flow', { name: '65 - Fluxo atendente', description: 'Troca controlada para validar a sessão de atendente.', auth: 'inherit', order: 7500 }],
  ['55-destructive', { name: '55 - Operações destrutivas', description: 'Operações administrativas de empresa executadas após os fluxos superadmin dependentes.', auth: 'inherit', order: 6500 }],
  ['80-final-account', { name: '80 - Finalização da conta', description: 'Operações que podem invalidar a sessão e devem ocorrer no fim.', auth: 'inherit', order: 8000 }],
  ['90-validation-cases', { name: '90 - Casos de validação', description: 'Erros representativos sem mutação persistente.', auth: 'noauth', order: 9000 }],
  ['99-session-cleanup', { name: '99 - Encerrar sessão', description: 'Limpeza da autenticação ao final do fluxo.', auth: 'noauth', order: 9900 }],
])

export const environmentValues = [
  ['baseUrl', 'http://localhost:3000', 'default', 'Origem do backend, sem barra final.'],
  ['confirmedWriteBaseUrl', '', 'default', 'Repita exatamente baseUrl para confirmar mutações neste ambiente.'],
  ['accessToken', '', 'secret', 'JWT opcional. O fluxo padrão usa o cookie sessao.'],
  ['allowWrites', 'false', 'default', 'Defina true para permitir operações que criam ou alteram dados.'],
  ['allowDestructive', 'false', 'default', 'Defina true, junto de allowWrites, para suspender, arquivar ou excluir.'],
  ['allowAdministrativeWrites', 'false', 'default', 'Permite alterações administrativas depois da confirmação do ambiente.'],
  ['allowEmails', 'false', 'default', 'Permite fluxos que podem enviar e-mails.'],
  ['allowIdentityWrites', 'false', 'default', 'Permite redefinição e definição de senha.'],
  ['allowStorage', 'false', 'default', 'Permite gravar arquivos no storage configurado.'],
  ['allowProfileUpdate', 'false', 'default', 'Permite alterar o próprio perfil e invalidar a sessão.'],
  ['allowRoleSwitch', 'false', 'default', 'Permite substituir a sessão ativa por outro papel.'],
  ['superAdminEmail', '', 'secret', 'E-mail do superadmin usado no login.'],
  ['superAdminPassword', '', 'secret', 'Senha do superadmin usado no login.'],
  ['companyAdminEmail', '', 'secret', 'E-mail de um admin_empresa.'],
  ['companyAdminPassword', '', 'secret', 'Senha de um admin_empresa.'],
  ['attendantEmail', '', 'secret', 'E-mail de um atendente.'],
  ['attendantPassword', '', 'secret', 'Senha de um atendente.'],
  ['newPassword', '', 'secret', 'Nova senha com no mínimo 8 caracteres.'],
  ['resetToken', '', 'secret', 'Token recebido pelo fluxo de recuperação.'],
  ['inviteToken', '', 'secret', 'Token recebido pelo convite.'],
  ['inviteEmail', '', 'secret', 'E-mail usado no reenvio de convite.'],
  ['passwordRecoveryEmail', '', 'secret', 'E-mail usado na recuperação de senha.'],
  ['profileName', '', 'default', 'Nome usado na edição do próprio perfil.'],
  ['profileEmail', '', 'secret', 'E-mail usado na edição do próprio perfil.'],
  ['companyId', '', 'default', 'UUID capturado das respostas de empresa.'],
  ['companyUserId', '', 'default', 'ID capturado do usuário empresarial.'],
  ['administratorId', '', 'default', 'ID capturado de outro superadmin.'],
  ['planId', '', 'default', 'ID capturado de um plano.'],
  ['saleId', '', 'default', 'UUID capturado de uma venda manual.'],
  ['initialSaleId', '', 'default', 'UUID capturado da venda de criação da empresa.'],
  ['imageId', '', 'default', 'UUID capturado após upload de capa.'],
  ['companyOperationId', '', 'default', 'UUID de idempotência do cadastro da empresa.'],
  ['salePlanOperationId', '', 'default', 'UUID de idempotência da venda manual vinculada ao plano.'],
  ['saleAmountOperationId', '', 'default', 'UUID de idempotência da venda manual com valor informado.'],
  ['imageFilePath', 'postman/fixtures/company-cover.png', 'default', 'Caminho de PNG, JPG ou WEBP de até 10 MB, relativo à raiz do repositório.'],
  ['searchTerm', 'Civix', 'default', 'Termo da busca pública.'],
  ['category', 'Serviços', 'default', 'Categoria usada nos filtros e cadastros.'],
  ['state', 'CE', 'default', 'Estado usado nos filtros e cadastros.'],
  ['companySize', 'pequena', 'default', 'pequena, media ou grande.'],
  ['page', '1', 'default', 'Página administrativa.'],
  ['limit', '20', 'default', 'Itens por página, máximo 100.'],
  ['companyName', '', 'default', 'Gerado antes do cadastro quando vazio.'],
  ['companyCnpj', '', 'default', 'Gerado antes do cadastro quando vazio.'],
  ['companyEmail', '', 'secret', 'Gerado antes do cadastro quando vazio.'],
  ['planName', '', 'default', 'Gerado antes da criação quando vazio.'],
  ['planSlug', '', 'default', 'Gerado antes da criação quando vazio.'],
  ['managedUserName', 'Atendente Postman', 'default', 'Nome usado no convite empresarial.'],
  ['managedUserEmail', '', 'secret', 'Gerado antes do convite quando vazio.'],
  ['administratorName', 'Superadmin Postman', 'default', 'Nome usado no convite de superadmin.'],
  ['administratorEmail', '', 'secret', 'Gerado antes do convite quando vazio.'],
  ['deactivationReason', 'Validação administrativa via Postman.', 'default', 'Motivo obrigatório das desativações e exclusões.'],
  ['soldAt', '', 'default', 'Data UTC da venda; gerada quando vazia.'],
]

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function indentBlock(value, spaces) {
  const prefix = ' '.repeat(spaces)
  return String(value).split('\n').map((line) => prefix + line).join('\n')
}

function buildUrl(route) {
  const query = route.query.map(({ key, value }) => `${encodeURIComponent(key)}=${value}`).join('&')
  return `{{baseUrl}}${route.path}${query ? `?${query}` : ''}`
}

function authYaml(auth) {
  if (auth === 'noauth') return ['auth:', '  type: noauth']
  if (auth === 'inherit') return ['auth:', '  type: inherit']
  return []
}

function setupScript(route) {
  const lines = []
  const requiredFlags = []
  const pathVariables = [...route.path.matchAll(/{{([A-Za-z][A-Za-z0-9]*)}}/g)].map((match) => match[1])
  const requiredVariables = [...new Set([...pathVariables, ...route.requiredVariables])]

  if (route.write) {
    requiredFlags.push('allowWrites')
  }

  if (route.destructive) {
    requiredFlags.push('allowDestructive')
  }

  requiredFlags.push(...route.guardFlags)

  if (route.write || route.guardFlags.length || requiredVariables.length) {
    lines.push(
      `const requiredFlags = ${JSON.stringify([...new Set(requiredFlags)])};`,
      `const requiredVariables = ${JSON.stringify(requiredVariables)};`,
      "const missingFlags = requiredFlags.filter((flag) => pm.environment.get(flag) !== 'true');",
      "const missingVariables = requiredVariables.filter((variable) => !String(pm.environment.get(variable) || '').trim());",
    )

    if (route.write) {
      lines.push(
        "const baseUrl = (pm.environment.get('baseUrl') || '').replace(/[/]$/, '');",
        "const confirmedWriteBaseUrl = (pm.environment.get('confirmedWriteBaseUrl') || '').replace(/[/]$/, '');",
        'const environmentNotConfirmed = !baseUrl || confirmedWriteBaseUrl !== baseUrl;',
      )
    } else {
      lines.push('const environmentNotConfirmed = false;')
    }

    lines.push(
      'if (missingFlags.length || missingVariables.length || environmentNotConfirmed) {',
      "  const reasons = [];",
      "  if (missingFlags.length) reasons.push(`flags ausentes: ${missingFlags.join(', ')}`);",
      "  if (missingVariables.length) reasons.push(`variáveis ausentes: ${missingVariables.join(', ')}`);",
      "  if (environmentNotConfirmed) reasons.push('confirmedWriteBaseUrl deve ser igual a baseUrl');",
      "  console.warn(`Request ignorada: ${reasons.join('; ')}.`);",
      '  pm.execution.skipRequest();',
      '}',
    )
  }

  if (route.setup === 'login') {
    lines.push("pm.environment.unset('accessToken');")
  }

  if (route.setup === 'company') {
    lines.push(
      "const suffix = Date.now().toString();",
      "if (!pm.environment.get('companyOperationId')) pm.environment.set('companyOperationId', pm.variables.replaceIn('{{$guid}}'));",
      "if (!pm.environment.get('companyName')) pm.environment.set('companyName', `Empresa Postman ${suffix}`);",
      "if (!pm.environment.get('companyCnpj')) pm.environment.set('companyCnpj', `postman-${suffix}`);",
      "if (!pm.environment.get('companyEmail')) pm.environment.set('companyEmail', `empresa-${suffix}@example.test`);",
    )
  }

  if (route.setup === 'plan') {
    lines.push(
      "const suffix = Date.now().toString();",
      "if (!pm.environment.get('planName')) pm.environment.set('planName', `Plano Postman ${suffix}`);",
      "if (!pm.environment.get('planSlug')) pm.environment.set('planSlug', `plano-postman-${suffix}`);",
    )
  }

  if (route.setup === 'managedUser') {
    lines.push(
      "const suffix = Date.now().toString();",
      "if (!pm.environment.get('managedUserEmail')) pm.environment.set('managedUserEmail', `atendente-${suffix}@example.test`);",
    )
  }

  if (route.setup === 'administrator') {
    lines.push(
      "const suffix = Date.now().toString();",
      "if (!pm.environment.get('administratorEmail')) pm.environment.set('administratorEmail', `superadmin-${suffix}@example.test`);",
    )
  }

  if (route.setup === 'salePlan') {
    lines.push(
      "if (!pm.environment.get('salePlanOperationId')) pm.environment.set('salePlanOperationId', pm.variables.replaceIn('{{$guid}}'));",
      "if (!pm.environment.get('soldAt')) pm.environment.set('soldAt', new Date().toISOString());",
    )
  }

  if (route.setup === 'saleAmount') {
    lines.push(
      "if (!pm.environment.get('saleAmountOperationId')) pm.environment.set('saleAmountOperationId', pm.variables.replaceIn('{{$guid}}'));",
      "if (!pm.environment.get('soldAt')) pm.environment.set('soldAt', new Date().toISOString());",
    )
  }

  return lines.join('\n')
}

function testScript(route) {
  const lines = [
    `pm.test('Status ${route.expectedStatus}', () => pm.response.to.have.status(${route.expectedStatus}));`,
  ]

  if (route.expectedStatus === 204) {
    lines.push("pm.test('Resposta sem corpo', () => pm.expect(pm.response.text()).to.equal(''));")
    return lines.join('\n')
  }

  lines.push(
    'let body;',
    "pm.test('Resposta JSON válida', () => { body = pm.response.json(); pm.expect(body).to.be.an('object'); });",
  )

  if (route.errorResponse) {
    lines.push(
      "pm.test('Contrato de erro', () => {",
      '  pm.expect(body).to.have.property(\'status\', pm.response.code);',
      "  pm.expect(body).to.have.property('message').that.is.a('string');",
      "  pm.expect(body).to.have.property('code').that.is.a('string');",
      '});',
    )
  } else {
    lines.push(
      "pm.test('Envelope de sucesso', () => pm.expect(body).to.have.property('data'));",
    )
  }

  if (route.setup === 'login' && !route.errorResponse) {
    lines.push(
      "const sessionHeader = pm.response.headers.get('Set-Cookie') || '';",
      "pm.test('Cookie de sessão emitido', () => pm.expect(sessionHeader).to.include('sessao='));",
      "const token = body?.data?.token;",
      "if (typeof token === 'string' && token) pm.environment.set('accessToken', token);",
    )
  }

  if (route.file === 'logout') {
    lines.push("pm.environment.unset('accessToken');")
  }

  for (const [variable, path] of Object.entries(route.capture)) {
    lines.push(
      `const ${variable}Value = ${JSON.stringify(path)}.split('.').reduce((value, key) => value?.[key], body);`,
      `if (${variable}Value !== undefined && ${variable}Value !== null && ${variable}Value !== '') pm.environment.set(${JSON.stringify(variable)}, String(${variable}Value));`,
    )
  }

  return lines.join('\n')
}

function requestYaml(route, order) {
  const lines = [
    '$kind: http-request',
    `name: ${quote(route.name)}`,
    `method: ${route.method}`,
    `url: ${quote(buildUrl(route))}`,
    `order: ${order}`,
    ...authYaml(route.auth),
  ]

  if (route.query.length) {
    lines.push('queryParams:')
    for (const item of route.query) {
      lines.push(`  - key: ${item.key}`, `    value: ${quote(item.value)}`)
    }
  }

  if (route.body !== undefined) {
    lines.push(
      'headers:',
      '  - key: Content-Type',
      '    value: application/json',
      'body:',
      '  type: json',
      '  content: |-',
      indentBlock(JSON.stringify(route.body, null, 2), 4),
    )
  }

  if (route.formdata) {
    lines.push('body:', '  type: formdata', '  content:')
    for (const item of route.formdata) {
      lines.push(`    - key: ${item.key}`, `      type: ${item.type}`)
      if (item.type === 'file') {
        lines.push(`      src: ${quote(item.src)}`)
        if (item.contentType) lines.push(`      contentType: ${item.contentType}`)
      } else {
        lines.push(`      value: ${quote(item.value)}`)
      }
    }
  }

  const beforeRequest = setupScript(route)
  const afterResponse = testScript(route)
  lines.push('scripts:')
  if (beforeRequest) {
    lines.push(
      '  - type: beforeRequest',
      '    language: text/javascript',
      '    code: |-',
      indentBlock(beforeRequest, 6),
    )
  }
  lines.push(
    '  - type: afterResponse',
    '    language: text/javascript',
    '    code: |-',
    indentBlock(afterResponse, 6),
  )

  return lines.join('\n') + '\n'
}

function definitionYaml(pathParts) {
  const key = pathParts.join('/')
  const topLevel = folderMetadata.get(pathParts[0])
  const metadata = folderMetadata.get(key) ?? {
    name: pathParts.at(-1).replaceAll('-', ' '),
    description: `Subgrupo ${pathParts.at(-1).replaceAll('-', ' ')}.`,
    auth: topLevel?.auth ?? 'inherit',
    order: (pathParts.length + 1) * 1000,
  }

  return [
    '$kind: collection',
    `name: ${quote(metadata.name)}`,
    `description: ${quote(metadata.description)}`,
    `order: ${metadata.order}`,
    ...authYaml(metadata.auth),
    '',
  ].join('\n')
}

function collectionDefinitionYaml() {
  const lines = [
    '$kind: collection',
    "name: 'Civix API'",
    "description: 'Collection canônica dos endpoints realmente montados no backend Civix.'",
    'auth:',
    '  type: bearer',
    '  credentials:',
    '    - key: token',
    "      value: '{{accessToken}}'",
    'variables:',
  ]

  for (const [key, value, , description] of environmentValues) {
    lines.push(
      `  - key: ${key}`,
      `    value: ${quote(value)}`,
      `    description: ${quote(description)}`,
    )
  }

  return lines.join('\n') + '\n'
}

function v2Auth(auth = 'inherit') {
  if (auth === 'noauth') return { type: 'noauth' }
  if (auth === 'inherit') return undefined
  return { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] }
}

function v2Request(route) {
  const rawUrl = buildUrl(route)
  const item = {
    name: route.name,
    event: [],
    request: {
      method: route.method,
      header: [],
      url: {
        raw: rawUrl,
        host: ['{{baseUrl}}'],
        path: route.path.split('/').filter(Boolean),
        ...(route.query.length ? { query: route.query.map(({ key, value }) => ({ key, value })) } : {}),
      },
      description: route.description,
    },
    response: [],
  }

  const auth = v2Auth(route.auth)
  if (auth) item.request.auth = auth

  if (route.body !== undefined) {
    item.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' })
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(route.body, null, 2),
      options: { raw: { language: 'json' } },
    }
  }

  if (route.formdata) {
    item.request.body = {
      mode: 'formdata',
      formdata: route.formdata.map((part) => part.type === 'file'
        ? { key: part.key, type: 'file', src: part.src, contentType: part.contentType }
        : { key: part.key, type: 'text', value: part.value }),
    }
  }

  if (route.method === 'DELETE' && route.body !== undefined) {
    item.protocolProfileBehavior = { disableBodyPruning: true }
  }

  const beforeRequest = setupScript(route)
  if (beforeRequest) {
    item.event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: beforeRequest.split('\n') } })
  }
  item.event.push({ listen: 'test', script: { type: 'text/javascript', exec: testScript(route).split('\n') } })

  return item
}

function v2Collection() {
  const root = {
    info: {
      _postman_id: '7bb505dd-c38a-4a8e-a92e-8bbba8f6e34e',
      name: 'Civix API',
      description: 'Todos os endpoints efetivamente montados no backend Civix, com fluxos e validações reutilizáveis.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: v2Auth('bearer'),
    variable: environmentValues.map(([key, value, , description]) => ({ key, value, type: 'string', description })),
    item: [],
  }
  const folders = new Map([['', root]])

  for (const route of requests) {
    let parentKey = ''
    let parent = root

    for (const part of route.folder) {
      const key = parentKey ? `${parentKey}/${part}` : part
      if (!folders.has(key)) {
        const topLevel = folderMetadata.get(part)
        const folder = {
          name: topLevel?.name ?? part.replaceAll('-', ' '),
          description: topLevel?.description ?? '',
          item: [],
        }
        const auth = topLevel ? v2Auth(topLevel.auth) : undefined
        if (auth) folder.auth = auth
        parent.item.push(folder)
        folders.set(key, folder)
      }
      parent = folders.get(key)
      parentKey = key
    }

    parent.item.push(v2Request(route))
  }

  root.item.sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))

  return root
}

function v3Environment(name, baseUrl) {
  const lines = [`name: ${quote(name)}`, 'values:']
  for (const [key, defaultValue, type, description] of environmentValues) {
    const value = key === 'baseUrl' ? baseUrl : defaultValue
    lines.push(
      `  - key: ${key}`,
      `    value: ${quote(value)}`,
      '    enabled: true',
      `    type: ${type}`,
      `    description: ${quote(description)}`,
    )
  }
  return lines.join('\n') + '\n'
}

function v2Environment(name, baseUrl, id) {
  return {
    id,
    name,
    values: environmentValues.map(([key, defaultValue, type]) => ({
      key,
      value: key === 'baseUrl' ? baseUrl : defaultValue,
      type,
      enabled: true,
    })),
    _postman_variable_scope: 'environment',
    _postman_exported_at: '2026-11-05T00:00:00.000Z',
    _postman_exported_using: 'Civix repository generator',
  }
}

function routeInventory() {
  const rows = requests.map((route) => {
    const auth = route.auth === 'noauth' || ['00-system', '10-authentication', '20-public-catalog'].includes(route.folder[0])
      ? 'Pública'
      : 'Autenticada'
    const effect = route.destructive ? 'Destrutiva' : route.write ? 'Escrita' : 'Leitura'
    return `| ${route.method} | \`${route.path}\` | ${auth} | ${effect} | ${route.expectedStatus} |`
  })
  return [
    '# Inventário de rotas da collection',
    '',
    `Total: **${new Set(requests.filter((route) => route.folder[0] !== '90-validation-cases').map((route) => `${route.method} ${route.path}`)).size} endpoints montados** em **${requests.length} requests**. Logins por papel, variantes de venda e casos negativos reutilizam algumas rotas. O inventário reflete o bootstrap em \`backend/src/app.ts\`.`,
    '',
    '| Método | Path | Acesso | Efeito | Sucesso esperado |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '## Rotas deliberadamente ausentes',
    '',
    '- `backend/src/routes/admin.routes.ts` não é montado em `app.ts`; portanto, `/api/v1/admin/invite` não é executável.',
    '- Não existem rotas montadas de pagamentos, assinaturas, trials, configurações globais ou métricas dedicadas.',
    '- Upload de logo não é fluxo de sucesso: o serviço atual aceita somente `purpose=cover`.',
    '',
  ].join('\n')
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, 'utf8')
}

async function writeBinary(path, content) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

export async function generate() {
  await Promise.all([
    rm(collectionDirectory, { recursive: true, force: true }),
    rm(environmentDirectory, { recursive: true, force: true }),
    rm(importDirectory, { recursive: true, force: true }),
  ])

  await write(join(collectionDirectory, '.resources', 'definition.yaml'), collectionDefinitionYaml())

  const folders = new Set(requests.flatMap((route) => route.folder.map((_, index) => route.folder.slice(0, index + 1).join('/'))))
  for (const folder of folders) {
    const parts = folder.split('/')
    await write(join(collectionDirectory, ...parts, '.resources', 'definition.yaml'), definitionYaml(parts))
  }

  const perFolderOrder = new Map()
  for (const route of requests) {
    const folderKey = route.folder.join('/')
    const order = (perFolderOrder.get(folderKey) ?? 0) + 1000
    perFolderOrder.set(folderKey, order)
    await write(join(collectionDirectory, ...route.folder, `${route.file}.request.yaml`), requestYaml(route, order))
  }

  await write(join(environmentDirectory, 'Local.environment.yaml'), v3Environment('Civix Local', 'http://localhost:3000'))
  await write(join(environmentDirectory, 'Staging.environment.yaml'), v3Environment('Civix Staging', 'https://staging.example.invalid'))
  await write(join(importDirectory, 'Civix API.postman_collection.json'), JSON.stringify(v2Collection(), null, 2) + '\n')
  await write(join(importDirectory, 'Civix Local.postman_environment.json'), JSON.stringify(v2Environment('Civix Local', 'http://localhost:3000', 'db4c23ef-fb09-497a-baa0-af7308dd78b1'), null, 2) + '\n')
  await write(join(importDirectory, 'Civix Staging.postman_environment.json'), JSON.stringify(v2Environment('Civix Staging', 'https://staging.example.invalid', 'c772ee98-2f49-4fe1-82d0-4b3e7ff62790'), null, 2) + '\n')
  await writeBinary(
    join(postmanDirectory, 'fixtures', 'company-cover.png'),
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  )
  await write(join(postmanDirectory, 'ROUTES.md'), routeInventory())
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generate()
  console.log(`Postman gerado: ${requests.length} requests.`)
}
