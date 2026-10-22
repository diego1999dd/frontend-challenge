# Fechamento da revisão — 22/10/2026

Complemento de [corrections-review.md](./corrections-review.md), após reler o [enunciado oficial](https://github.com/junglegaming/frontend-challenge).

## Correções complementares

- Galeria com arte completa e três enquadramentos da mesma arte, selecionáveis por teclado e no mobile. A seleção altera a imagem principal e a ampliação; não troca o NFT por outra obra. Metadados ausentes são adicionados a bases antigas sem resetar preço, estoque, contas ou compras.
- Rótulos de contrato e direitos autorais corrigidos.
- Retorno do login restrito a caminhos internos, rejeitando barras invertidas e caracteres de controle.
- Cenário reproduzível `payment-pending` em `/demo`, mantendo a compra pendente por 60 segundos. O teste interrompe o Socket.IO durante a pendência, recarrega e avança o relógio, exigindo o mesmo pedido confirmado, sem duplicação. Replay não muda o estado terminal.
- Reflow de Home, detalhe, carrinho, pagamento, perfil e carteiras em 720/384/320px. É a largura CSS efetiva correspondente a zoom de 200%, limitada a 320px; não é uma medição de zoom físico em celular. Quebra de linha dos filtros e destaque compacto corrigem overflow em telas estreitas; skeletons da galeria acompanham o tamanho das miniaturas.
- Transições nativas limitadas a mudanças de página. A repetição do teste de histórico revelou interferência ao animar mudanças de filtros na mesma página. O teste agora aguarda cada URL efetivamente confirmada antes de voltar. Movimento reduzido continua respeitado; navegadores sem suporte às transições tipadas usam navegação sem essa animação.
- Três baselines de detalhe revisadas após as miniaturas e os rótulos, sem aumentar tolerâncias nem remover as asserções de geometria desktop.
- Otimização da abertura real: sem animação da carga inicial, hashes fictícios pré-calculados no seed, CSS de comércio lazy e sem consulta/renderização de relacionados que o layout já ocultava no mobile. Não foram reduzidas latências nem desativados mocks, imagens, fontes ou fluxos para a auditoria. Uma tentativa de inicialização paralela foi descartada por não melhorar as medições.

## Evidências

- Lint, formatação, tipos e build aprovados.
- Checkout Git independente em `2d166c1`, com `pnpm install --frozen-lockfile --offline` e build aprovados (476 pacotes, sem reutilizar o `node_modules` original). Os commits posteriores só ajustam uma espera visual mobile e documentação/relatórios, sem modificar o runtime.
- Smoke desse build de produção em 1440/768/390px: login, carteiras, seleção da galeria, carregamento lazy do CSS, compra confirmada e refresh do mesmo recibo aprovados; nenhum erro de página nesses fluxos.
- **96 testes aprovados** na execução completa final, sem atualização de snapshots: 32 cenários em três perfis, incluindo 15 verificações visuais.
- O teste de histórico do slider passou também em **15 repetições** (cinco por perfil) após restringir as transições a mudanças de página.
- Lighthouse final: **91/89 mobile e 99/99 desktop** (Home/detalhe), demais categorias em 100. Medianas de três medições. **O detalhe mobile não atingiu a meta de 90**; a análise descreve o caminho crítico e a limitação, sem substituir a medição por uma rodada histórica mais favorável.

As execuções completas finais e as condições da auditoria estão no [relatório Playwright](../reports/playwright/index.html) e no [resumo Lighthouse](../reports/lighthouse/SUMMARY.md), com [análise](../reports/lighthouse/ANALYSIS.md), HTML e JSON individuais. O HTML de testes é copiado somente depois da execução completa aprovada.

## Limites e entrega

A captura original da tela de erro genérico não permitiu identificar sua causa. Há recuperação validada para falha de chunk, mas isso não prova que era o mesmo defeito. Se reaparecer, registrar ação, Console e Network antes de atribuir uma causa.

As anotações `CORRECOES.md`, imagens de revisão na raiz e eventual `ARCHITECTURE copy.md` permanecem locais e foram excluídas apenas neste clone, via `.git/info/exclude`; não foram apagadas. O material de entrega inclui fontes, assets, mocks, cenários, baselines e os relatórios exigidos pelo desafio. Não inclui `node_modules`, `dist` ou resultados temporários de testes.

O push desta revisão é para `fix/ui-review`. Ele não faz merge automático em `main` nem comprova atualização da URL pública. Antes da entrega ao avaliador, integrar a revisão e conferir o deploy correspondente, incluindo acesso direto, login, compra e refresh do recibo.
