# Lighthouse local — continuação de performance

Auditoria de confirmação iniciada em **22/10/2026 às 21:13:45 UTC (18:13:45 em São Paulo)**. Build de produção servido pelo Vite Preview; MSW e funcionalidades ativos; cenário padrão; três medições sequenciais por página/perfil, sem E2E em paralelo. O script, a configuração e as latências não foram alterados.

## Resultados finais

| Perfil  | Página  | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS    | TBT (ms) |
| ------- | ------- | ----------- | -------------- | ------------- | --- | -------- | ------ | -------- |
| Mobile  | Home    | 91          | 100            | 100           | 100 | 2844     | 0,0486 | 16       |
| Mobile  | Detalhe | 91          | 100            | 100           | 100 | 3034     | 0,0000 | 22       |
| Desktop | Home    | 100         | 100            | 100           | 100 | 734      | 0,0178 | 0        |
| Desktop | Detalhe | 99          | 100            | 100           | 100 | 825      | 0,0178 | 0        |

São medianas de três execuções. Metas: performance ≥90, acessibilidade ≥95, boas práticas ≥95 e SEO ≥90. **Todas as medianas atingiram as metas nesta confirmação.** A primeira rodada com o adaptador lazy teve 91/90 mobile e 100/99 desktop; a confirmação teve 91/91 e 100/99. Isso não garante nota idêntica em outra máquina ou execução, especialmente perto do limite mobile.

Os **12 HTMLs e 12 JSONs individuais desta rodada** estão nas subpastas `mobile` e `desktop`. `SUMMARY.md`, `summary.json` e `environment.json` descrevem o conjunto atual, não relatórios históricos.

## Condições e limites

- Node 22.23.1, pnpm 11.8.0, Lighthouse 12.6.1, Chromium 156.0.8078.4.
- Windows x64, Ryzen 7 5700X, 16 CPUs lógicas e 32 GiB de RAM; demais detalhes em `environment.json`.
- Throttling simulado padrão do Lighthouse e perfis originais do projeto. O navegador permanece aberto ao longo das doze execuções, como no script local anterior.
- Nenhuma alteração de latência, dados, mocks, imagem, fonte ou funcionalidade exclusiva para obter nota. Não é PageSpeed Insights nem medição em um celular físico.
- Auditorias públicas históricas usaram um navegador novo por amostra; não são experimentos idênticos a este. A versão pública medida anteriormente não contém necessariamente estas correções locais.

## Ajuste encontrado pela própria auditoria

A primeira rodada desta revisão apontou alvos de toque insuficientes nas novas bolinhas de carrossel (acessibilidade 96/97 na Home e 97 no detalhe desktop). Pseudo-elementos com áreas sobrepostas não bastavam. Foram adotados **botões reais de 24×24px ou mais**, com pontos visuais pequenos e espaçamento adequado. A auditoria final voltou a 100 em acessibilidade em todos os perfis. O espaçamento é um desvio deliberado de acessibilidade em relação ao Figma, documentado em `docs/corrections-review.md`. A rodada intermediária foi arquivada fora do repositório.

## Comparação e trabalho de otimização

O detalhe mobile passou de performance **89 para 91** e LCP mediano de **3267 para 3034ms**, com CLS zero e TBT baixo. O elemento LCP continua sendo a imagem principal, obtida pela mesma consulta REST e com a mesma qualidade. O relatório anterior mostrava o download do cliente Socket.IO praticamente junto com o da imagem, além do adaptador de protocolo no bootstrap REST.

O worker agora inicia com os handlers REST, sem importar imediatamente o adaptador Socket.IO. Esse adaptador é registrado sob demanda antes de criar o cliente. A imagem inicial ganha prioridade de pintura, com limite de espera de um segundo, erro tratado e cancelamento ao desmontar/trocar sessão. Não há pausa fixa quando ela já está pronta. A conexão continua real e reconcilia o estado com REST ao conectar, recuperando alterações anteriores; não há setters substituindo os eventos nem confirmação de compra fora da simulação. A melhora foi medida no conjunto, não atribuída isoladamente a cada linha.

As otimizações anteriores foram preservadas. Apenas aguardar a pintura, sem separar o adaptador do bootstrap, manteve o detalhe em 89; esse experimento não é apresentado como sucesso isolado. Relatórios completos da primeira rodada bem-sucedida foram arquivados fora do repositório; os HTML/JSON versionáveis acima são da confirmação mais recente. Detalhes em [performance-followup.md](../../docs/performance-followup.md).

## Verificação complementar

- **99 testes Playwright aprovados**, incluindo 15 visuais, em 1440/768/390px (capturas de referência mobile em 414×896). O teste adicional verifica espera por imagem, cancelamento e fallback; os demais exercitam Socket.IO, reconexão, isolamento e compra. O relatório HTML corresponde à execução completa aprovada.
- Treze baselines revistas após as correções; rodada completa posterior sem atualização de snapshots, sem alterar tolerâncias ou asserções de geometria do Figma.
- Lint, formatação, tipos e build aprovados; dependências e lockfile não foram alterados. A instalação separada com lockfile congelado/offline pertence à verificação anterior, não foi repetida nesta continuação.
- Build de produção servido localmente em 1440/768/390px: adaptador lazy conecta, evento Socket.IO atualiza o preço e o aviso, compra confirma e o mesmo recibo é recuperado após refresh. Nenhum erro de página nesses fluxos.
- A recuperação de chunk com HTTP 404 foi verificada na rodada anterior; o E2E de recuperação continua aprovado. Isso não confirma a causa da captura genérica original.

## Reproduzir

```sh
pnpm build
pnpm run audit
```

Não rode E2E ou tarefas pesadas ao mesmo tempo. Detalhamento das correções e ressalvas em [docs/corrections-review.md](../../docs/corrections-review.md). Esta medição valida o build local; é necessário publicar e conferir a nova revisão antes da entrega.
