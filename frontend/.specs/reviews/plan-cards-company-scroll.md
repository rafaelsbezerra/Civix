# Cards de planos e posição ao abrir empresa

Data: 2026-10-12. Trabalho autorizado diretamente em staging.

## Cards: alteração concluída

[PlanCard](../../src/components/plans/PlanCard.tsx) usa rounded-2xl, como
os cards de empresas. O arredondamento aplica-se às variantes comum e
recomendada; preços, conteúdo, cores, destinos e animações são preservados.
[Guia do produto](../../../docs/produto.md) atualizado.

Verificação: PlanCard.test.tsx e PlansSection.test.tsx passaram (3 testes).
Diff sem erros. Na Home local, os três cards exibiram border-radius de 18 px,
conforme o tema vigente, e foi registrada captura fora do repositório.
Não houve instalação, teste/build global ou alteração de backend/AGENTS.

## Perfil: investigação, sem alteração de código

Os cards chamam navigate('/empresa/:id') em
[CardEmpresas](../../src/components/EmpresasCard/CardEmpresas.tsx) e
[catálogo](../../src/pages/CatalogoEmpresas.tsx). Não reposicionam a página.
[PublicSmoothScroll](../../src/components/layout/PublicSmoothScroll.tsx)
retorna sem agir quando não existe hash. A instância Lenis permanece entre
páginas públicas porque o efeito de inicialização depende de isPublicPage,
não de pathname. Não há política global de ScrollRestoration no router.

Na versão instalada do Lenis, stopInertiaOnNavigate atende cliques em links
a; os cards usam navegação programática. Interromper inércia na posição
atual tampouco significa navegar até o topo. A navegação atual não garante
posição inicial para o perfil.

[PerfilEmpresa](../../src/pages/PerfilEmpresa.tsx) primeiro renderiza loading
com footer, busca a API e depois monta o conteúdo completo. A interação
entre altura variável, posição anterior, inércia e ancoragem do navegador
é uma hipótese para a intermitência, não um timing comprovado nesta inspeção.

Observação real: Home na seção Empresas com scrollY=2062 → perfil terminou
com scrollY=0 e título visível. A abertura na parte inferior não se reproduziu
nessa tentativa. A ausência de reposicionamento foi confirmada no código;
não declarar que uma correção de rolagem foi implementada.

## Evolução proposta

**Aguardando resposta:** corrigir a política de rolagem em entrega própria:
nova navegação sem hash abre no topo, âncoras continuam compensadas pela
navbar e Voltar/Avançar recebe tratamento explícito de restauração.
Considerar sincronização com Lenis e o carregamento da API; validar cliques
com inércia ativa e respostas rápidas/lentas. Não aplicar essa proposta na
alteração visual dos planos.

As alterações pré-existentes do usuário no backend e em docs/arquitetura.md
foram preservadas e não pertencem ao commit desta tarefa.
