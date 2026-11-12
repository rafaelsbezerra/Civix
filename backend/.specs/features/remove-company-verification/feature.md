# Remoção da verificação de empresas

Status: implementação futura

## Contexto e decisão

Uma empresa é considerada verificada ao ser criada. O mecanismo separado de verificação não é mais necessário. A remoção da rota de consulta de empresas verificadas e dos campos relacionados será tratada em uma implementação posterior, fora da migração atual para Prisma.

## Escopo da implementação futura

- Identificar a rota existente, seus consumidores e os contratos relacionados à verificação de empresas.
- Remover a rota e os campos de verificação, ajustando os consumidores e testes afetados.
- Verificar a compatibilidade dos dados locais e das respostas existentes durante a remoção.

## Pendências

- **Aguardando resposta:** definir os detalhes de compatibilidade e a ordem de remoção dos contratos após identificar os consumidores existentes.
