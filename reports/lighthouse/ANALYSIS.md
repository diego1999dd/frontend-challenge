# Lighthouse local — revisão de UI e interações

Auditoria iniciada em **22/10/2026 às 20:49:35 UTC (17:49:35 em São Paulo)**, após as correções e a revisão final. Build de produção servido pelo Vite Preview; MSW e funcionalidades ativos; cenário padrão; três medições sequenciais por página/perfil, sem E2E em paralelo. O script e a configuração da auditoria não foram alterados.

## Resultados finais

| Perfil  | Página  | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS    | TBT (ms) |
| ------- | ------- | ----------- | -------------- | ------------- | --- | -------- | ------ | -------- |
| Mobile  | Home    | 91          | 100            | 100           | 100 | 2833     | 0,0486 | 15       |
| Mobile  | Detalhe | 89          | 100            | 100           | 100 | 3267     | 0,0000 | 14       |
| Desktop | Home    | 99          | 100            | 100           | 100 | 747      | 0,0178 | 0        |
| Desktop | Detalhe | 99          | 100            | 100           | 100 | 789      | 0,0178 | 0        |

São medianas de três execuções. Metas: performance ≥90, acessibilidade ≥95, boas práticas ≥95 e SEO ≥90. **A performance do detalhe mobile ficou um ponto abaixo da meta**; as demais medianas atingiram as metas. A rodada histórica de 90/90 não substitui o resultado atual. Notas variam e não há garantia de repetição exata.

Os **12 HTMLs e 12 JSONs individuais desta rodada** estão nas subpastas `mobile` e `desktop`. `SUMMARY.md`, `summary.json` e `environment.json` descrevem o conjunto atual, não relatórios históricos.

## Condições e limites

- Node 22.23.1, pnpm 11.8.0, Lighthouse 12.6.1, Chromium 156.0.8078.4.
- Windows x64, Ryzen 7 5700X, 16 CPUs lógicas e 32 GiB de RAM; demais detalhes em `environment.json`.
- Throttling simulado padrão do Lighthouse e perfis originais do projeto. O navegador permanece aberto ao longo das doze execuções, como no script local anterior.
- Nenhuma alteração de latência, dados, mocks, imagem, fonte ou funcionalidade exclusiva para obter nota. Não é PageSpeed Insights nem medição em um celular físico.
- Auditorias públicas históricas usaram um navegador novo por amostra; não são experimentos idênticos a este. A versão pública medida anteriormente não contém necessariamente estas correções locais.

## Ajuste encontrado pela própria auditoria

A primeira rodada desta revisão apontou alvos de toque insuficientes nas novas bolinhas de carrossel (acessibilidade 96/97 na Home e 97 no detalhe desktop). Pseudo-elementos com áreas sobrepostas não bastavam. Foram adotados **botões reais de 24×24px ou mais**, com pontos visuais pequenos e espaçamento adequado. A auditoria final voltou a 100 em acessibilidade em todos os perfis. O espaçamento é um desvio deliberado de acessibilidade em relação ao Figma, documentado em `docs/corrections-review.md`. A rodada intermediária foi arquivada fora do repositório.

## Resultado abaixo da meta e trabalho de otimização

O detalhe mobile tem LCP de aproximadamente **3,27 s**, CLS zero e TBT baixo. O elemento LCP é a imagem principal. O caminho crítico inclui carregamento/execução do frontend e MSW, consulta REST com latência padrão e descoberta/decodificação da imagem; não há um bloqueio longo único nem deslocamento de layout que explique o resultado. O preload da imagem continua usando a resposta real da API, sem embutir o resultado de uma fixture na página. A próxima otimização deve reduzir esse caminho crítico, principalmente a carga inicial de JavaScript, mantendo a API como referência.

Foram mantidas as mudanças de benefício funcional: não animar a carga inicial, seed com hashes fictícios pré-calculados (validação PBKDF2 preservada), CSS de comércio lazy e nenhuma consulta/renderização da seção de relacionados já oculta no mobile. Isso não comprova causalidade isolada de cada mudança nas notas. Experimentos de inicialização paralela e CSS inline não melhoraram o detalhe e foram descartados. As condições de auditoria e latências não foram reduzidas para atingir a meta. Uma rodada intermediária com 89/89 foi arquivada fora do repositório.

## Verificação complementar

- **96 testes Playwright aprovados** na revisão funcional, incluindo 15 visuais, em 1440/768/390px (capturas de referência mobile em 414×896). O relatório HTML final acompanha os fontes desta entrega.
- Treze baselines revistas após as correções; rodada completa posterior sem atualização de snapshots, sem alterar tolerâncias ou asserções de geometria do Figma.
- Lint, formatação, tipos e build aprovados; instalação separada com lockfile congelado/offline e build também aprovados.
- Build de produção servido localmente: perfil/carteiras, ausência de overflow, compra e refresh do recibo verificados nos três tamanhos.
- Recuperação de chunk verificada com HTTP 404 na primeira requisição real de uma página lazy: uma recarga recuperou a tela e a sessão. Isso não confirma a causa da captura genérica original.

## Reproduzir

```sh
pnpm build
pnpm run audit
```

Não rode E2E ou tarefas pesadas ao mesmo tempo. Detalhamento das correções e ressalvas em [docs/corrections-review.md](../../docs/corrections-review.md). Esta medição valida o build local; é necessário publicar e conferir a nova revisão antes da entrega.
