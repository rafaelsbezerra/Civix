# Cards de planos e posição ao abrir empresa

Data: 2026-10-12. Trabalho autorizado diretamente em staging.

## Cards: alterações concluídas

[PlanCard](../../src/components/plans/PlanCard.tsx) usa rounded-2xl, como
os cards de empresas. O arredondamento aplica-se às variantes comum e
recomendada. O título recomendado agora declara a cor clara da identidade,
sobrescrevendo somente nesse título a regra global .about-page h2 do CSS.
About adiciona essa classe ao body da Home; sua regra com !important impunha
texto azul também ao card de fundo azul. As demais cores e a tipografia
foram preservadas. [Guia do produto](../../../docs/produto.md) atualizado.

## Perfil: diagnóstico original e correção autorizada

No commit 87a45b2, os cards chamavam navigate('/empresa/:id') em
[CardEmpresas](../../src/components/EmpresasCard/CardEmpresas.tsx) e
[catálogo](../../src/pages/CatalogoEmpresas.tsx), sem reposicionar a página.
[PublicSmoothScroll](../../src/components/layout/PublicSmoothScroll.tsx)
retornava sem agir quando não existia hash. A instância Lenis permanecia
entre páginas públicas. stopInertiaOnNavigate atende links, mas não garante
o topo na navegação programática dos cards. O router não usa ScrollRestoration.

[PerfilEmpresa](../../src/pages/PerfilEmpresa.tsx) primeiro exibe loading,
busca a API e depois monta o conteúdo. Altura variável, posição anterior e
inércia podem contribuir para a intermitência; o timing exato não foi comprovado.
Na investigação original, uma tentativa terminou corretamente com scrollY=0.
Isso não demonstrava uma política de reposicionamento no código antigo.

O usuário autorizou a correção nesta entrega. PUSH/REPLACE sem hash agora
abre no topo por rolagem nativa imediata. Lenis é parado antes e sincronizado
depois, preservando eventual estado pausado. Apenas scrollTo(immediate)
não bastava: Lenis retorna cedo se o alvo já coincide com targetScroll,
mesmo enquanto a posição real ainda está distante e em movimento.

Âncoras iniciais/entre páginas são alinhadas com a compensação da navbar e
acompanhadas por ResizeObserver até a primeira interação. Isso cobre a
mudança de altura quando empresas/planos chegam da API. Voltar/Avançar
preserva a restauração nativa, sem forçar topo ou reabrir âncora histórica.
Preferência por movimento reduzido mantém reposicionamento nativo.
Frames, listeners e observer são limpos em navegação/desmontagem/StrictMode.
[Guia de operação](../../../docs/operacao.md) atualizado.

## Verificação desta entrega

No navegador local, o título Profissional apresentou rgb(250, 249, 246),
as variantes comuns conservaram rgb(11, 24, 37) e os cantos arredondados
permaneceram. Abrir diretamente /#planos terminou com a seção a 130 px do
topo após a chegada dos dados. Um clique em Horizonte abriu o perfil com
scrollY=0 e título visível. Voltar conservou posição diferente de zero;
Avançar retornou ao perfil com scrollY=0. Captura visual fora do repositório.

Os testes direcionados de PublicSmoothScroll, PlanCard e PlansSection
passaram (21/21). ESLint dos dois componentes e do teste passou;
TypeScript e diff foram conferidos antes do commit. Os testes cobrem
PUSH/REPLACE, POP, alvo antigo do Lenis igual a zero, preferência reduzida,
âncoras, dados tardios, interação, cleanup, estado pausado e StrictMode.
Não houve instalação de dependências, alteração de AGENTS, backend, login,
rotas ou dados locais. Não foram repetidos build global ou testes históricos
alheios ao escopo; não declarar aprovação desses gates.
