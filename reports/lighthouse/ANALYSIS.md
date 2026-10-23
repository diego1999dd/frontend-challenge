# Lighthouse local — auditoria de entrega

Auditoria iniciada em **23/10/2026 às 01:09:20 UTC (22/10/2026 às 22:09:20 em São Paulo)**, conforme `environment.json`. As doze amostras vão de 01:09:22 a 01:10:58 UTC. Este documento descreve o conjunto recuperado da última execução local, não a rodada anterior das 18h13. Build de produção servido pelo Vite Preview; MSW e funcionalidades ativos; cenário padrão; três medições por página/perfil, com throttling simulado padrão.

## Resultados finais

| Perfil  | Página  | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS    | TBT (ms) |
| ------- | ------- | ----------- | -------------- | ------------- | --- | -------- | ------ | -------- |
| Mobile  | Home    | 91          | 100            | 100           | 100 | 2854     | 0,0486 | 21       |
| Mobile  | Detalhe | 90          | 100            | 100           | 100 | 3015     | 0,0000 | 12       |
| Desktop | Home    | 99          | 100            | 100           | 100 | 768      | 0,0178 | 0        |
| Desktop | Detalhe | 99          | 100            | 100           | 100 | 788      | 0,0178 | 0        |

São medianas de três execuções por página/perfil, calculadas separadamente para cada categoria e métrica. Metas: performance ≥90, acessibilidade ≥95, boas práticas ≥95 e SEO ≥90. **Todas as medianas atingiram as metas nesta execução.** O detalhe mobile está exatamente no limite de 90; não há garantia de nota idêntica em outra máquina ou execução. A rodada anterior teve 91/91 mobile e 100/99 desktop; ela não substitui os resultados atuais.

Os **12 HTMLs e 12 JSONs individuais desta rodada** estão nas subpastas `mobile` e `desktop`. `SUMMARY.md`, `summary.json` e `environment.json` descrevem o mesmo conjunto. Na conferência, as medianas foram recalculadas dos JSONs e coincidiram com os resumos; os HTMLs contêm as datas das amostras correspondentes e nenhum JSON apresenta `runtimeError`. Os nomes com hash dos 11 módulos JavaScript carregados também estão presentes no build local conferido. O ambiente não registra um SHA Git do build, portanto essa verificação não deve ser apresentada como identificação formal de commit.

## Condições e limites

- Node 22.23.1, pnpm 11.8.0, Lighthouse 12.6.1, Chromium 156.0.8078.4.
- Windows x64, Ryzen 7 5700X, 16 CPUs lógicas e 32 GiB de RAM; demais detalhes em `environment.json`.
- Throttling simulado padrão do Lighthouse e perfis originais do projeto. O navegador permanece aberto ao longo das doze execuções, como no script local anterior.
- Nenhuma alteração de latência, dados, mocks, imagem, fonte ou funcionalidade exclusiva para obter nota. Não é PageSpeed Insights nem medição em um celular físico.
- Auditorias públicas históricas usaram um navegador novo por amostra; não são experimentos idênticos a este. A versão pública medida anteriormente não contém necessariamente estas correções locais.

## Ajustes de acessibilidade em rodadas anteriores

Rodadas anteriores apontaram alvos de toque insuficientes nas bolinhas de carrossel (acessibilidade 96/97 na Home e 97 no detalhe desktop). Pseudo-elementos com áreas sobrepostas não bastavam. Foram adotados **botões reais de 24×24px ou mais**, com pontos visuais pequenos e espaçamento adequado. Nesta execução, acessibilidade permanece em 100 nos quatro conjuntos. O espaçamento é um desvio deliberado de acessibilidade em relação ao Figma, documentado em [verificação visual](../../docs/design-verification.md).

## Comparação e trabalho de otimização

Uma referência histórica anterior às otimizações tinha performance 89 e LCP de 3267ms no detalhe mobile. Nesta rodada, os valores são **90 e 3015ms**, com CLS zero e TBT de 12ms. A comparação não é um experimento controlado para atribuir a diferença a uma mudança isolada. O elemento LCP continua sendo a imagem principal, obtida pela consulta REST, sem retirar imagens ou funcionalidades da auditoria.

O worker agora inicia com os handlers REST, sem importar imediatamente o adaptador Socket.IO. Esse adaptador é registrado sob demanda antes de criar o cliente. A imagem inicial ganha prioridade de pintura, com limite de espera de um segundo, erro tratado e cancelamento ao desmontar/trocar sessão. Não há pausa fixa quando ela já está pronta. A conexão continua real e reconcilia o estado com REST ao conectar, recuperando alterações anteriores; não há setters substituindo os eventos nem confirmação de compra fora da simulação. A melhora foi medida no conjunto, não atribuída isoladamente a cada linha.

As otimizações anteriores foram preservadas. Apenas aguardar a pintura, sem separar o adaptador do bootstrap, manteve o detalhe em 89 em um experimento anterior; esse experimento não é apresentado como sucesso isolado. Os HTML/JSON entregues são os da rodada identificada no início deste documento, mesmo quando uma rodada anterior teve uma pontuação maior. A separação do adaptador, reconciliação e cancelamento estão descritos na [arquitetura](../../ARCHITECTURE.md).

## Verificação complementar

- O relatório entregue em `reports/playwright/index.html` registra **114 testes aprovados**, incluindo 15 visuais, em 1440/768/390px (capturas de referência mobile em 414×896). É uma execução independente do Lighthouse, não um resultado produzido pela auditoria.
- Os testes incluem os fluxos REST/Socket.IO, compra e recuperação da API após suspensão do Service Worker. A última rodada aprovada não alterou snapshots, tolerâncias ou asserções de geometria do Figma.
- A restauração e conferência destes relatórios não executou novamente Lighthouse, build ou E2E. Não houve alteração dos scripts de auditoria, latências ou código da aplicação nesta correção documental.

## Reproduzir

```sh
pnpm build
pnpm run audit
```

Não rode E2E ou tarefas pesadas ao mesmo tempo. Decisões e limitações estão na [arquitetura](../../ARCHITECTURE.md) e na [verificação visual](../../docs/design-verification.md). Esta medição valida o build local da rodada identificada acima, não comprova a publicação de revisões posteriores.
