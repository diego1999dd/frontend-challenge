# Kurio — NFT Marketplace

Implementação local do desafio Jungle Gaming com React, TypeScript, TanStack Router/Query, Axios, Tailwind, shadcn/ui, MSW, Socket.IO, Playwright e Lighthouse.

Todos os dados, contas, carteiras e pagamentos são fictícios. **Não conecte uma carteira real nem envie criptomoedas.** A aplicação funciona sem backend ou serviço privado.

## Executar

Ambiente utilizado: Node 22.23.1 e pnpm 11.8.0.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev:mocks
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173). O Vite pode escolher outra porta caso ela esteja ocupada. Não é necessário criar `.env`.

| Comando             | Finalidade                                            |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev:mocks`    | Desenvolvimento com API e eventos simulados           |
| `pnpm build`        | TypeScript e build de produção                        |
| `pnpm preview`      | Servir o build localmente                             |
| `pnpm typecheck`    | Verificação de tipos                                  |
| `pnpm lint`         | ESLint sem warnings                                   |
| `pnpm format:check` | Conferir formatação                                   |
| `pnpm test:e2e`     | E2E e regressão visual em Chromium                    |
| `pnpm test:report`  | Abrir o relatório HTML do Playwright                  |
| `pnpm run audit`    | Lighthouse: três medições por página/perfil           |
| `pnpm audit --prod` | Auditoria de dependências de produção, não Lighthouse |

Execute `pnpm build` antes do Lighthouse. O script inicia e encerra um preview na porta 4173, usa o Chromium instalado pelo Playwright e salva HTML, JSON, ambiente e medianas em `reports/lighthouse`. Não exige Google Chrome instalado no sistema. Evite rodar os E2E junto à auditoria para não disputar CPU.

## Contas e cenários

| Conta | E-mail           | Senha fictícia |
| ----- | ---------------- | -------------- |
| Ana   | ana@kurio.test   | Demo123!       |
| Bruno | bruno@kurio.test | Demo123!       |

As contas iniciais têm uma carteira Ethereum fictícia. Novos cadastros começam sem carteiras: adicione uma em **Carteiras** antes de comprar. O formulário aceita endereço Ethereum/Polygon `0x` com 40 caracteres hexadecimais ou endereço Solana válido no formato simulado. A conexão tem opções explícitas de autorizar, recusar e desconectar.

O catálogo tem 36 NFTs, nove por página. `nft-2` possui a edição `1/1` indisponível; `nft-36` está esgotado. O cupom `KURIO10` desconta 10%; `EXPIRADO` exercita expiração. Preços, descontos e taxas são calculados no mock da API em wei com BigInt.

Abra [/demo](http://127.0.0.1:5173/demo) para selecionar cenários reproduzíveis: carregamento lento, respostas fora de ordem, falha de conexão, HTTP 503, falha de favorito com rollback, cupom expirado, preço alterado, pagamento recusado e timeout após criação do pedido. O painel continua acessível durante os cenários de falha. Selecione **Normal** para recuperar a rede simulada.

**Restaurar cenário inicial** pede confirmação e apaga somente os dados fictícios Kurio deste navegador: cadastros, sessões, favoritos, carteiras, carrinhos, pedidos e rascunhos. Não remove outros dados do navegador. Recarregar a página não reseta o cenário nem os dados.

## Fluxos

- Descoberta: busca, filtros combinados, preço, rede, ordenação, paginação e histórico pela URL.
- Detalhe: acesso direto/404, galeria, zoom, edição, disponibilidade, quantidade e favorito.
- Conta: cadastro, conflito de e-mail/usuário, login, logout, expiração e retorno ao fluxo anterior.
- Favoritos: atualização otimista, rollback e persistência isolada por usuário.
- Carrinho: visitante e usuário, merge no login, quantidades, remoção, cupom e cotação.
- Compra: carteira/rede cadastradas, conexão simulada, dados do colecionador, revisão explícita e envio idempotente.
- Pedido: pendente, confirmado ou recusado; recuperação depois de timeout, refresh e reconexão. O recibo é um snapshot imutável da compra.
- Perfil/carteiras: edição, avatar PNG/JPEG/WebP de até 1 MB, senha e carteira principal/secundária.

Pagamentos recusados preservam o carrinho. A confirmação remove apenas as quantidades compradas. Uma cotação desatualizada exige nova revisão; o cliente não assume sucesso quando a rede falha.

## Testes e referências

Os testes executam em 1440, 768 e 390px, com capturas do mobile de referência em 414×896. Cada teste usa um contexto isolado. As fixtures são controladas por requisições aos handlers MSW; os testes de tempo real atravessam `socket.io-client`.

Baselines: `tests/e2e/*-snapshots`. Exports originais do Figma: `tests/visual/references`. Atualize baselines apenas após revisão visual:

```sh
pnpm test:e2e --update-snapshots
```

O relatório HTML é gerado em `playwright-report`; traces e screenshots de falhas ficam em `test-results`. A suíte completa local passou os **60 testes** em 22/10/2026. O HTML dessa rodada é gerado localmente, não incluído neste commit; relatórios anteriormente versionados são históricos. Inclui filtros codificados na URL e navegação entre páginas sob demanda sem erros do React. Oito baselines foram atualizadas após revisar as diferenças de rasterização das imagens responsivas; depois a suíte completa, incluindo as **15 verificações visuais**, passou sem atualizar snapshots. Não foram alteradas medidas de layout nem tolerâncias dos testes. O relatório em `reports/playwright-reviewed-failures` preserva traces históricos de diferenças já resolvidas, não falhas pendentes. As baselines detectam regressões da implementação, não equivalência absoluta de pixels com o Figma.

Os PNGs originais foram preservados e têm cópias AVIF de alta qualidade para entrega, reduzindo aproximadamente 8 MB para 0,85 MB nas quatro artes em resolução original. Cards e galeria também oferecem variantes de 384/768px por `srcset`/`sizes`; a versão de 1254px continua disponível para telas maiores e zoom. Logo, ícones e imagens são locais. A fonte Roboto Mono também é empacotada localmente.

## Configuração e limites

`VITE_ENABLE_MOCKS` é `true` por padrão, inclusive no build de demonstração. `VITE_ENABLE_MOCKS=false` permite preparar uma integração externa; `VITE_API_URL` configura a base HTTP. O desafio entregue utiliza os mocks, não um backend real. Nenhuma variável `VITE_*` deve conter segredos.

A sessão e a base simulada ficam no armazenamento local. Senhas são derivadas com PBKDF2, não armazenadas em claro; isso **não transforma o frontend em um serviço seguro de autenticação real**. Use apenas dados fictícios. MSW e Web Locks exigem navegador moderno e contexto seguro: localhost ou HTTPS.

As integrações editoriais, sociais e de suporte fora do escopo exibem aviso coerente; não simulam sucesso. As conexões Socket.IO simuladas são locais à aba; não há sincronização de eventos entre dispositivos. A persistência compartilhada por abas usa Web Locks para evitar sobrescritas concorrentes.

Versão pública: [frontend-challenge.diego-9090dd.workers.dev](https://frontend-challenge.diego-9090dd.workers.dev). Após configurar o fallback SPA no Wrangler, acesso direto ao perfil/detalhe/checkout, login e recuperação do recibo após refresh foram verificados no Edge. Essa verificação não representa uma execução da suíte completa na hospedagem. As otimizações locais de carregamento ainda precisam ser publicadas; a medição pública corresponde à versão anterior.

Arquitetura e contratos: [ARCHITECTURE.md](./ARCHITECTURE.md). Fidelidade e desvios: [docs/design-verification.md](./docs/design-verification.md).

Auditoria histórica da **URL pública em 22/10/2026**: performance **93 no mobile e 100 no desktop** nas duas páginas; acessibilidade, boas práticas e SEO **100** em todos os perfis. São medianas de três execuções independentes por página/perfil, com os mocks ativos. Todas as metas de nota do desafio foram atendidas nessa rodada da versão anterior. Os relatórios públicos detalhados foram mantidos localmente, fora deste commit.

A auditoria **local após otimização em 22/10/2026**, com `pnpm build` e `pnpm run audit`, registrou performance **91/90 no mobile (Home/detalhe)** e **99/99 no desktop**, com as outras categorias em **100**. São medianas de três execuções por página/perfil, mantendo mocks, latências e configuração da auditoria. Antes, o resultado local era 89/88 no mobile. [Medianas locais](./reports/lighthouse/SUMMARY.md) e [análise local](./reports/lighthouse/ANALYSIS.md). A execução pública usa condições diferentes; os resultados não isolam a causa da diferença nem garantem notas futuras.
