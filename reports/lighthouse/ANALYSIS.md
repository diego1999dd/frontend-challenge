# Análise das auditorias locais

Medição iniciada em 22/10/2026 às 06:17:33 UTC (03:17:33 em São Paulo), com build de produção servido por Vite Preview, mocks ativos, cenário padrão e três execuções sequenciais por página/perfil. Os E2E não rodaram em paralelo. Versões, hardware e condições estão em `environment.json`; as medianas completas estão em `SUMMARY.md` e `summary.json`. Os doze relatórios individuais HTML/JSON desta rodada foram preservados apenas localmente, fora deste commit. Arquivos individuais anteriormente versionados são históricos; execute a auditoria para regenerá-los para o código atual.

## Metas e resultados

| Categoria      | Meta | Home mobile | Detalhe mobile | Home desktop | Detalhe desktop |
| -------------- | ---- | ----------- | -------------- | ------------ | --------------- |
| Performance    | ≥ 90 | **91**      | **90**         | 99           | 99              |
| Accessibility  | ≥ 95 | 100         | 100            | 100          | 100             |
| Best Practices | ≥ 95 | 100         | 100            | 100          | 100             |
| SEO            | ≥ 90 | 100         | 100            | 100          | 100             |

As metas foram atingidas nas medianas desta rodada, não necessariamente em cada execução individual. O detalhe está no limite da meta; CPU, rede e navegador podem alterar a nota. As notas automáticas de acessibilidade não substituem a verificação por teclado, foco e labels exercitada pelos E2E.

## Comparação com o resultado anterior

| Mobile  | Performance anterior → atual | LCP anterior → atual | TBT atual |
| ------- | ---------------------------- | -------------------- | --------- |
| Home    | 89 → 91                      | 3.249 → 2.846 ms     | 19 ms     |
| Detalhe | 88 → 90                      | 3.498 → 3.050 ms     | 24 ms     |

O CLS permaneceu em 0,0486 na Home e zero no detalhe mobile. O desktop manteve 99 nas duas páginas. O resultado anterior é histórico; os relatórios desta pasta foram substituídos pela nova rodada. Foi feita uma cópia de segurança local dos relatórios anteriores antes da otimização.

O limitante continua sendo o LCP, não tarefas longas. As fases dos relatórios anteriores indicavam descoberta tardia da imagem e espera pelo bootstrap. A melhoria observada é do conjunto de mudanças abaixo; não foi isolado o ganho de cada uma.

## Mudanças implementadas nesta rodada

- Páginas secundárias de conta/compra sob demanda com `React.lazy` e `Suspense`; helper de redirecionamento separado para não importar a página de login antecipadamente.
- Definições de rotas e sessão estáticas, permitindo descoberta das dependências no HTML. Fragmentar o bootstrap em mais imports dinâmicos não melhorou as medições intermediárias.
- `modulepreload` do bootstrap MSW e suas dependências no build de demonstração. O worker continua precisando estar pronto antes de montar React ou consultar REST.
- Consulta inicial antecipada no mesmo cache TanStack Query e pela mesma camada Axios/MSW. Filtros usam a interpretação da URL feita pelo Router. A arte do detalhe é descoberta após a resposta REST, com os mesmos atributos responsivos do componente.
- Variantes AVIF RGB de 384/768px por `srcset`/`sizes`, preservando originais PNG e AVIF de 1254px e a geometria das telas.
- Importação inicial do cliente Socket.IO após a sessão e as primeiras consultas públicas concluírem. Refetches posteriores não reiniciam o socket. Ao conectar/reconectar, REST reconcilia o estado, inclusive mudanças ocorridas durante a espera inicial.

Não foram alterados `scripts/audit.mjs`, `lighthouserc.cjs`, latências dos mocks, throttling, metas ou número de medições para obter essas notas. O bootstrap não acessa fixtures diretamente. O comportamento é o mesmo fora da auditoria.

## Verificação

- ESLint e build de produção aprovados.
- **60 testes Playwright aprovados**, em desktop/tablet/mobile, incluindo filtros codificados na URL, páginas sob demanda sem erros do React, falhas/recuperação, idempotência, isolamento de sessão e eventos Socket.IO.
- **15 verificações visuais** aprovadas nessa suíte. Oito baselines foram revistas e atualizadas pela rasterização das variantes; depois a suíte passou sem atualizar snapshots, sem mudar tolerâncias ou medidas de layout.
- Smoke adicional no build de produção em 1440/390px: imagem responsiva, compra, refresh do recibo imutável, limpeza do carrinho e atualização Socket.IO aprovados, sem erros de página/React.
- Build separado com `VITE_ENABLE_MOCKS=false` aprovado, sem chunk de bootstrap MSW ou seu preload. O build auditado continua com mocks ativos.

## Reproduzir e limites

```sh
pnpm build
pnpm run audit
```

Não execute E2E ou tarefas pesadas em paralelo. O script usa um navegador durante as doze medições, como antes; a auditoria pública histórica usa execuções independentes. Os procedimentos não são idênticos, portanto a diferença local/pública não prova isoladamente um efeito da Cloudflare. Os resultados não garantem notas futuras nem representam a publicação dessas otimizações locais.
