# Snapshot da documentação do Notion

Fonte: https://app.notion.com/p/3a05228ef45d80ba8ecef017c05f6e31

Captura: 2026-10-09 (America/Fortaleza). Última edição informada pelo
Notion: 2026-09-03T18:51:03.707Z. Estado: não verificada.

Conteúdo preservado no formato retornado pelo conector. Exemplos de SQL,
comandos e sugestões são históricos; não são instruções de implantação.
Metadados de capa e URLs temporárias de arquivos não foram exportados.

+Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3a05228ef45d80ba8ecef017c05f6e31 as of 2026-09-03T18:51:18.521Z:
<page url="https://app.notion.com/p/3a05228ef45d80ba8ecef017c05f6e31" icon="🔗">
<ancestor-path></ancestor-path>
<properties>
{"title":"Civix"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"🔗"}</iconMetadata>
<content>
<empty-block/>
## **Visão Geral:**
- Plataforma de atendimento para negócios e empresas com nicho para a área de construção civil com Inteligência Artificial.
- O UrbanSync é uma plataforma SaaS de atendimento inteligente que utiliza Inteligência Artificial para automatizar o primeiro contato entre empresas e clientes, responder dúvidas frequentes, qualificar oportunidades de venda e fornecer aos vendedores todo o contexto necessário para dar continuidade ao atendimento. Além da automação do atendimento, a plataforma oferece dashboards gerenciais, métricas de desempenho, acompanhamento das conversas e gestão de equipes, permitindo que empresas reduzam custos operacionais e aumentem a eficiência do processo comercial.
- UrbanSync cuida da qualificação de leads, atendimentos rápidos e prepara o cliente para a compra/fechamento do negócio.<br>
## Problema(s):
- falta de atendimento 24/7 dos negócios e empresas. 
- necessidade de atende humano do início ao final do funil de vendas e para qualquer tipo de pergunta.
- grande volume de mensagens repetitivas;
- demora no 1° atendimento
- dificuldade para escalar o atendimento sem contratar mais pessoas.
- perda de oportunidades por demora na resposta.
- vendedores ocupando tempo com perguntas simples.
## Solução/Objetivo:
- Plataforma de atendimento inteligente que utiliza Inteligência Artificial para automatizar o atendimento 24 horas por dia, qualificar clientes, organizar o processo comercial e centralizar a gestão de conversas, leads e vendas em um único sistema.
<empty-block/>
- O objetivo do UrbanSync é automatizar a etapa inicial do atendimento comercial utilizando Inteligência Artificial, permitindo que vendedores recebam apenas clientes já qualificados, com histórico completo da conversa e intenção de compra identificada.
<empty-block/>
## Cores:
- Amarelo → `#D89C28`
- Azul → `#07192A`
- Branco → `#FAF9F6`
- Preto → `#0E0E10`
## Slugs:
- A TECNOLOGIA QUE CONSTRÓI O FUTURO
- A plataforma que conecta pessoas, serviços e soluções para transformar o mercado da construção e inovação, praticidade e confiança
## Stack:
- **Front: **Next, Tailwind CSS, Lenis.js `(biblioteca para scroll, deixar ele mais “smooth)`
- **Back: **Node, TypeScript,  Express
- **Banco de Dados: **PostegreSQL (Neon)
- **ORM: **Prisma
- **Libs/Bibliotecas: **Zod, jwt, bcrypt, shadcn, lenis.js, slugify
- **Testes: **Playwright, Vitest
- **Hospedagem/Infra: **Hostinger
- **CI/CD:** Github Actions
- **Serviços externos: **Neon, Auth0, Hostinger
## Comandos de instalação:
Backend:
- `npm init -y`
- `npm install express`
- `npm install helmet`
- `npm install compression`
- `npm install slugify`
- `npm install cors`
- `npm install cookie-parser`
- `npm install zod`
- `npm install  prisma @prisma/client @prisma/adapter-pg`
- `npx tsc --init`
	- Dependências de desenvolvimento:
		- `npm install -D @types/node`
		- `mpm install -D typescript`
		- `npm install -D tsx`
		- `npm install -D @types/express`
		- `npm install -D @types/cors`
		- `npm install -D @types/cookie-parser`
Neon:
- `npm install @neondatabase/auth@latest`
	- Baixar as dependências do Neon
Front:
- `npx create-next-app@latest`
- `npm install tailwindcss @tailwindcss/vite`
- `npm install lenis`
## Scripts:
- Server Express
	```javascript
import "dotenv/config"
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("SERVIDOR RODANDO NA PORTA", PORT)
});
	```
- Prisma Client:
	```javascript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
	```
- Setup Lenis ([https://github.com/darkroomengineering/lenis/blob/main/README.md](https://github.com/darkroomengineering/lenis/blob/main/README.md))
	```javascript
import { ReactLenis, useLenis } from 'lenis/react'

function App() {
  const lenis = useLenis((lenis) => {
    // called every scroll
    console.log(lenis)
  })

  return (
    <>
      <ReactLenis root />
      { /* content */ }
    </>
  )
}
	```
- Postcss config tailwind
	```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
	```
- App Auth (Neon):
## Componentes Core:
- Auth
	- Responsável pela autenticação, autorização e gerenciamento de sessões.
- Tenant Management (gestão das empresas)
	- Gerencia as empresas (tenants) da plataforma e suas configurações.
- User Management
	- Gerencia usuários, papéis e permissões dentro de cada empresa.
- Plans Management
	- Gerencia planos disponíveis na UrbanSync
- Sales Management
	- Gerencia vendas feitas pela UrbanSync.
- Lead Management (qualificação de clientes/leads)
	- Responsável pela qualificação, organização e acompanhamento dos leads.
## Atores da aplicação:
- Empresas → Administrador e vendedor
- SuperAdmin → UrbanSync
- Clientes (Leads)
- Sistemas Externos\*
## **Canais de entrada:**
- Contato via site institucional
- Contato via WhatsApp da empresa
- Contato via site da empresa
## Casos de uso:
### 001 - Iniciar atendimento  {toggle="true"}
	- Permite que um cliente inicie um atendimento utilizando um dos canais disponibilizados pela empresa.
	- Fluxo:
		1. O cliente inicia uma conversa.
		2. O sistema identifica a empresa responsável pelo canal.
		3. O sistema cria uma nova conversa.
		4. O atendimento é direcionado ao fluxo inicial (IA ou atendimento humano).
### 002 - Assumir Atendimento {toggle="true"}
	- Permite que um vendedor assuma um atendimento iniciado automaticamente.
	- Fluxo:
		1. O vendedor visualiza atendimentos disponíveis.
		2. O vendedor seleciona um atendimento.
		3. O sistema atribui a conversa ao vendedor.
		4. O vendedor passa a responder o cliente.
### 003 – Encerrar Atendimento {toggle="true"}
	- Permite finalizar um atendimento.
	- Fluxo:
		1. O atendimento é marcado como concluído.
		2. O sistema altera o status da conversa e status do lead.
		3. O histórico permanece disponível para consultas futuras.
### 004 – Consultar Histórico de Conversas {toggle="true"}
	- Permite consultar o histórico de atendimentos registrados pelo sistema, incluindo informações relevantes coletadas durante a conversa entre o cliente e o chatbot.
	- Fluxo:
		1. O usuário acessa o histórico de atendimentos da empresa.
		2. O sistema lista os atendimentos registrados.
		3. O usuário seleciona um atendimento.
		4. O sistema exibe as informações armazenadas, como histórico da conversa, data de início, data de encerramento, cliente, lead relacionado e demais dados registrados pelo chatbot.
### 005 – Gerenciar Leads {toggle="true"}
	- Permite acompanhar o ciclo de vida de um lead.
	- Fluxo: 
		1. O usuário acessa o módulo de Leads.
		2. O sistema exibe os leads cadastrados.
		3. O usuário atualiza o estágio do lead.
		4. O sistema registra a alteração.
### 006 - Registrar resultado do atendimento {toggle="true"}
	<empty-block/>
### 007  - Marcar conversa como prioridade. {toggle="true"}
	<empty-block/>
### 008 - Reaoyubrir atendimento encerrado. {toggle="true"}
	<empty-block/>
## Requisitos Funcionais (RFs):
- O sistema deve controlar permissões por perfil.
- O sistema deve permitir alteração dos dados da empresa.
- O sistema deve permitir ativação e desativação de empresas.
- O sistema deve permitir transferência entre IA e vendedor.
- O sistema deve registrar e gerenciar leads.
- O sistema deve permitir acompanhamento do funil.
- O sistema deve permitir o administrador poder cadastrar vendedores.\*
- O sistema deve permitir o administrador alterar dados dos usuários.\*
- O sistema deve permitir o administrador gerenciar permissões.\*
- O sistema deve manter histórico das conversas.\*
## Requisitos Não Funcionais (RNFs):
- O sistema deve isolar completamente os dados entre empresas (multi-tenant).
- O sistema deve garantir o isolamento de contexto entre empresas, impedindo que dados, documentos, conversas ou configurações de uma empresa sejam utilizados em atendimentos de outra.
- As sessões devem expirar automaticamente após um período configurável.
- O sistema deve processar mensagens recebidas sem bloquear outras requisições.
- A aplicação deve suportar múltiplas empresas utilizando a mesma infraestrutura.
- O sistema deve estar disponível 24 horas por dia, exceto durante manutenções programadas.
- Backups automáticos do banco de dados devem ser realizados periodicamente.
<empty-block/>
## Regras de Negócio:
- Uma conversa só pode ser transferida para vendedores da mesma empresa.
- Conversas encerradas não podem receber novas mensagens, salvo reabertura.
- Toda transferência deve registrar data, hora e responsável.
- Se a IA detectar baixa confiança na resposta (ou atingir um limite de tentativas), deve oferecer o encaminhamento para um atendente humano.
- Ao criar uma empresa uma venda é lançada automaticamente. `(Mateus, discutir com equipe)`
## Padrões do Projeto:
<empty-block/>
## Arquitetura:
<details>
<summary>**ChatBot**:</summary>
	<details>
	<summary>**Webhook** → Nó inicial onde receberá todas as informações.</summary>
		- **POST:** [http://localhost:5678/webhook-test/waha](http://localhost:5678/webhook-test/waha)
		- **Path:** waha
		- **Authentication:** None
		- **Respond: **Immediately
	</details>
	<details>
	<summary>**Dados (set fields)** → Receberá os dados específicos que precisaremos para tratar</summary>
		- **session:** Nome da sessão no WAHA 
			```json
{{ $json.body.session }}
			```
		- **from: **Número que mandou a mensagem
			```json
{{ $json.body.payload.from }}
			```
		- **fromMe: **Indica se a mensagem veio do próprio número ou não
			```json
{{ $json.body.payload.fromMe }}
			```
		- **source:** Indica se a mensagem foi através do WhatsApp Web, API ou aplicativo
			```json
{{ $json.body.payload.source }}
			```
		- **body:** Conteúdo da mensagem recebida
			```json
{{ $json.body.payload.body }}
			```
		- **type:** Tipo da mensagem recebida (áudio, text, img e etc)
			```json
{{ $json.body.payload._data.type }}
			```
		- **id: **id da mensagem
			```json
{{ $json.body.payload._data.id.id }}
			```
		- to: Número de quem recebe a mensagem
			```json
{{ $json.body.payload.to }}
			```
	</details>
	<details>
	<summary>**if (verificar @lid)** → Verifica o @lid e converte para o número correto do lead @c.us</summary>
		- Faz a codificação
			<columns>
				<column ratio="81.25">
					\{\{ \$json.from \}\} {color="gray_bg"}
					@lid {color="gray_bg"}
				</column>
				<column ratio="87.5">
					**T** contains {color="gray_bg"}
					<empty-block/>
				</column>
			</columns>
		- Se **TRUE**
			-
	</details>
</details>
## Rotas API: {toggle="true"}
	**Url base:**
		- `/api/v1`
	<details>
	<summary>Users</summary>
		- GET - /users
		- GET - /users/:id
		- POST - /users
		- PUT - /users/:id
		- PATCH - /users/:id
		- DELETE - /users/:id
	</details>
	<details>
	<summary>Vendas (imutável) `(Mateus, discutir com equipe)`</summary>
		- GET - /vendas
		- GET - /vendas/:empresaId
		- POST - /vendas
		- DELETE - /vendas/:id
	</details>
	<details>
	<summary>Empresas</summary>
		- GET  - /empresas
		- GET - /empresas/:id
		- GET - /empresas/segmentoId
		- GET - /empresas/palnoId
		- POST - /empresas
		- PUT - /empresas/:id
		- PATCH - /empresas/:id
		- DELETE - /empresas/:id
	</details>
## Banco de Dados: {toggle="true"}
	- Users:
		- `ID`
		- `EMPRESA_ID`
		- `NOME`
		- `EMAIL`
		- `TELEFONE`
		- `ROLE`
		- `IS_ACTIVE`
		- `CREATED_AT`
		- `UPDATED_AT`
		```sql
CREATE TABLE USERS (
	ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	EMPRESA_ID UUID NOT NULL REFRENCES EMPRESAS(ID) ON DELETE RESTRICT ON UPDATE CASCADE,
	NOME VARCHAR(150) NOT NULL,
	EMAIL VARCHAR(180) NOT NULL,
	TELEFONE VARCHAR(20) NOT NULL,
	ROLE VARCHAR(20) NOT NULL CHECK(ROLE IN ("ADMIN", "SUPER_ADMIN", "VENDEDOR", "CLIENTE")),
	IS_ACTIVE BOOLEAN DEFAULT TRUE,
	CREATED_AT TIMESTAMP DEFAULT NOW(),
	UPDATED_AT TIMESTAMP DEFAULT NOW()
);
		```
	- Planos 
		- `ID`
		- `NOME`
		- `DESCRIÇÃO`
		- `PRECO_UNICO`
		- `MENSALIDADE`
		- `CREATED_AT`
		- `UPDATED_AT`
		```sql
CREATE TABLE PLANOS (
	ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	NOME VARCHAR(150) NOT NULL,
	DESCRICAO VARCHAR(255) NOT NULL,
	PRECO_UNICO NUMERIC(10, 2) NOT NULL CHECK(PRECO_UNICO > 0),
	MENSALIDADE NUMERIC(10, 2) NOT NULL CHECK(MENSALIDADE > 0),
	CREATED_AT TIMESTAMP DEFAULT NOW(),
	UPDATED_AT TIMESTAMP DEFAULT NOW()
);
		```
	- Vendas
		- `ID`
		- `EMPRESA_ID`
		- `VALOR`
		- `CREATED_AT`
		```sql
CREATE TABLE VENDAS (
	ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	EMPRESA_ID UUID NOT NULL REFERENCES EMPRESAS(ID) ON DELETE RESTRICT ON UPDATE CASCADE,
	VALOR NUMERIC(10, 2) NOT NULL CHECK(VALOR > 0),
	CREATED_AT TIMESTAMP DEFAULT NOW()
	);
		```
	- Segmentos:
		- `ID`
		- `NOME`
			```sql
CREATE TABLE SEGMENTOS(
	ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	NOME VARCHAR(150) NOT NULL,
)

			```
	- Empresas:
		- `ID`
		- `PLANO_ID`
		- `SEGMENTO_ID (modf)` 
		- `NOME`
		- `SLUG (modf)`
		- `EMAIL`
		- `TELEFONE`
		- `CIDADE`
		- `ESTADO`
		- `BAIRRO (modf)`
		<synced_block url="https://app.notion.com/p/3a05228ef45d80ba8ecef017c05f6e31#3d05228ef45d80bc8ae0f6366e69a756">
			- `ENDEREÇO`
		</synced_block>
		- `MEDIA_PRECO` → média de preco dos servicos para ajudar no 1° filtro de pesquisa da home (COLOCAR O VALOR MÁXIMO, ex: até 500.000mil)
		- `WELCOME_MESSAGE`  → mensagem padrão ao usuario clicar no botao de whatsapp da empresa ("Olá acessei pelo site, quero saber mais sobre a empresa X, de código X")
		```javascript
`link_whatsapp=${parametro}`
		```
		- `INSTAGRAM`
		- `SITE`
		- `COVER_IMAGE`   → Imagem que vai aparecer na listagem das empresas
		- `MINI_DESCRIÇÃO`
		- `SOBRE`
		- `SEGMENTO (modf)`
		- `IS_ACTIVE`
		- `CREATED_AT`
		- `UPDATED_AT`
		```sql
CREATE TABLE EMPRESAS (
	ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	PLANO_ID UUID NOT NULL REFRENCES PLANOS(ID) ON DELETE RESTRICT ON UPDATE CASCADE,
	SEGMENTO_ID UUID NOT NULL REFERENCES SEGMENTOS(ID) ON DELETE RESTRICT ON UPDATE CASCADE,
	NOME VARCHAR(150) NOT NULL,
	EMAIL VARCHAR(180) NOT NULL,
	SLUG VARCHAR(150) NOT NULL,
	TELEFONE VARCHAR(20) NOT NULL,
	CIDADE VARCHAR(120) NOT NULL,
	ESTADO VARCHAR(25) NOT NULL,
	BAIRRO VARCHAR(120),
	MEDIA_PRECO NUMERIC(10, 2) NOT NULL,
	ENDERECO VARCHAR(255) NOT NULL,
	WELCOME_MESSAGE VARCHAR(250),
	COVER_IMAGE ,
	MINI_DESCRICAO VARCHAR(255) NOT NULL,
	DESCRICAO TEXT NOT NULL,
	IS_ACTIVE BOOLEAN DEFAULT TRUE,
	CREATED_AT TIMESTAMP DEFAULT NOW(),
	UPDATED_AT TIMESTAMP DEFAULT NOW()
);
		```
	Índices:
		```sql

		```
## Fluxos: {toggle="true"}
	- Criação de empresa: 
	- Criação de usuário: 
	- Construção de contexto:
	- Iniciar conversa:
	- Atribuir conversa:
	- Login: 
	- Logout:
	- Refresh:
## Convenções: {toggle="true"}
	- Commits devem seguir  regras de conventional commits ([https://www.conventionalcommits.org/en/v1.0.0/](https://www.conventionalcommits.org/en/v1.0.0/))
	- Idioma do código: `decidir com a equipe`
	- Classes, interfaces e types escritas em PascalCase
	- Nome de arquivos e pastas em kebab-case (backend)
	- funções e variáveis em camelCase
	- constantes globais em UPPER_SNAKE_CASE
	```typescript
// Exxemplos:

// PascalCase:
	// classe:
	class UsersController {...}
	
	//interface:
	interface User {...}
	
	// types
	type User = {...}

// CamelCase:
	// variavel:
	const accessToken = 10;
	
	// função:
	function createUser(){...}

// Constantes globais:
	// UPPER_SNAKE_CASE:
	const ACCESS_TOKEN_EXPIRTATION = 50;


	```
## Telas: {toggle="true"}
	- Dashboard UrbanSync:
		- Home
		- Usuários
		- Empresas
		- Vendas
		- Config
	<empty-block/>
	- Dashboard Admin Empresa:
	<empty-block/>
	- Dasboard Atendente Empresa:
	<empty-block/>
	- Site institucional:
		1. Todas Empresas
		2. Empresa
		3. Sobre detalhado
		- Sessões: 
			1. Hero/Home
			2. Sobre
			3. Empresas
			4. Preços/Planos
			5. FAQ → área de perguntas frequentes
			6. CTA → “chamada para ação”, geralmente um botão para entrar em contato + uma mensagem apelativa 
			7. Footer - rodapé
## Justificativa de decisões (perguntas / respostas) {toggle="true"}
	<details>
	<summary>No sistema será possível cadastrar serviços oferecidos?</summary>
		R: Não, pois a participação da empresa cadastrada seria menor, ou seja, seguiremos apenas como intermédios das informações da empresa. 
	</details>
	<empty-block/>
	<details>
	<summary>Haverá um catálogo ou uma base de conhecimento pesquisável?</summary>
		R:  Haverá um catálogo das empresas, sendo que cada empresa terá informações que ajudarão a montar o contexto para a IA. Além disso, poderá ser possível cada empresa cadastarar 3 produtos/projetos/imóveis.
	</details>
	<empty-block/>
	<details>
	<summary>Atendente vai ter apenas 1 acesso?</summary>
		R: Por enquanto apenas 1 acesso mas aberto para atender multiplos acessos e atendentes e cada um vendo seus leads/conversas.
	</details>
	<empty-block/>
	<details>
	<summary>Iremos armazenar foto das empresas? Como iremos fazer isso?</summary>
		R: Podemos utilizar Cloudflare R2, que é um bucket para armazenamento de objetos. Ele é compatível com a API da amazon S2 que também é um serviço de bucket. `(Mateus, discutir com equipe)`
	</details>
	<empty-block/>
	<details>
	<summary>Como faremos para proteger as rotas que a IA vai usar? E como iremos estabelecer uma conexão segura entre a IA e a API?</summary>
		R: Podemos utilizar uma API key que pode ser enviada via Bearer token que é mais simples e possui uma fácil implementação. Ou podemos utilizar assinatura HMAC, porém possui uma implementação mais complexa. `(Mateus, discutir com equipe)`
	</details>
	<empty-block/>
	<details>
	<summary>Como iremos fazer para atender múltiplos clientes que entram em contato com as empresas de diferentes segmentos utilizando o mesmo chat bot e banco de dados?</summary>
		R: Tudo isso será feito pela construção de contexto da IA e por pesquisas feitas pelo ID da empresa no banco. Cada empresa terá informações padrões no banco que serão usadas para montar tal contexto para a IA. `(Mateus, discutir com equipe)`
	</details>
	<empty-block/>
	<details>
	<summary>Fornecimento de credencias de acesso aos atendentes? Fornecimento de credenciais de acesso às empresas?</summary>
		R: Podemos fazer “recuperação de senha” em 1° acesso. A empresa/atendente será cadastrado no sistema sem ter uma senha. A partir do momento que ela tentar entrar no sistema pela 1° vez será enviado um email para ela informando para ela criar uma senha. Ela cria essa senha e faz o login novamente.`(Mateus, discutir com equipe)`
	</details>
	<empty-block/>
	<details>
	<summary>Quais informações (fixas) vamos precisar de todas as empresas/parceiros? Essas informações irão ajudar a montar o prompt e contexto para  a IA.</summary>
		R: Inicialmente, um sobre detalhado que pode ser separado em descrição completa que irá ser usado pela IA e uma mini descrição para ser exibida no site institucional. `(Mateus, discutir com equipe)`
	</details>
	<empty-block/>
	<details>
	<summary>A IA irá utilizar um build context para cada atendimento? </summary>
		R: Não, inicialmente o n8n esta fazendo uma query diretamente no banco de dados. `(Mateus)` 
	</details>
	<empty-block/>
	<details>
	<summary>Teremos modulo de venda? Na parte de vendas será necessário criar uma venda manualmente ou a cada cadastro de uma nova empresa uma venda é lançada automaticamente com base nos valores dos planos existentes? </summary>
		R: Acredito que seja melhor a cada vez que uma empresa seja criada uma venda seja lançada, com isso métodos mutáveis são feitos apenas internamente (infra interna), já métodos imutáveis (get) são feitos pela api e terão rotas http. `(Mateus, discutir com equipe)`
	</details>
	<empty-block/>
	<details>
	<summary>Caso a empresa ja possua um sistema iremos fazer integrações com os sistemas da empresa apenas para o chatbot? Ou a empresa utilizará nosso sistema?</summary>
		R: 
	</details>
	<empty-block/>
	<details>
	<summary>Como faremos para limitar o acesso das empresas novas ao sistema por 7 dias? Quais campos no banco podem identificar isso?</summary>
		R:
	</details>
	<empty-block/>
	<details>
	<summary>Como iremos fazer para qualificar leads e fazer o “funil” de vendas?</summary>
		R:
	</details>
	<empty-block/>
	<empty-block/>
	<details>
	<summary>Utilizando a API de autenticação (Auth0), qual será nossa responsabilidade em relação a autenticação e autorização? será necessário armazenar refresh tokens no banco de dados?</summary>
		R:
	</details>
	<empty-block/>
	<details>
	<summary>Quais informações podemos salvar em cache? e porque?</summary>
		R:
	</details>
	<empty-block/>
	<details>
	<summary>Qual é a quantidade de armazenamento média que uma nova empresa ocupa no banco?</summary>
		R:
	</details>
	<empty-block/>
	<empty-block/>
	<empty-block/>
<empty-block/>
</content>
</page>
