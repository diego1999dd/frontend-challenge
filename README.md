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

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173). A porta 5173 deve estar livre: o servidor usa `strictPort` e não escolhe outra automaticamente. Não é necessário criar `.env`.

| Comando             | Finalidade                                            |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev:mocks`    | Desenvolvimento com API e eventos simulados           |
| `pnpm build`        | TypeScript e build de produção                        |
| `pnpm preview`      | Servir o build localmente                             |
| `pnpm typecheck`    | Verificação de tipos                                  |
| `pnpm lint`         | ESLint sem warnings                                   |
| `pnpm format:check` | Conferir formatação                                   |
| `pnpm test:e2e`     | E2E e regressão visual em Chromium                    |
| `pnpm test:report`  | Abrir o relatório gerado após executar os testes      |
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

Abra [/demo](http://127.0.0.1:5173/demo) para selecionar cenários reproduzíveis: carregamento lento, respostas fora de ordem, falha de conexão, HTTP 503, falha de favorito com rollback, cupom expirado, preço alterado, pagamento recusado, pedido pendente por 60 segundos e timeout após criação do pedido. O painel continua acessível durante os cenários de falha. Selecione **Normal** para recuperar a rede simulada.

**Restaurar cenário inicial** pede confirmação e apaga somente os dados fictícios Kurio deste navegador: cadastros, sessões, favoritos, carteiras, carrinhos, pedidos e rascunhos. Não remove outros dados do navegador. Recarregar a página não reseta o cenário nem os dados.

Para exercitar falhas, selecione uma opção no `/demo` e siga o fluxo correspondente; volte a **Normal** entre cenários. Não é necessário resetar os dados para recuperar a rede.

| Cenário                     | Como reproduzir e verificar                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Carregamento lento          | Abra um detalhe após selecionar; aparece skeleton antes do conteúdo.                                     |
| HTTP 503 / falha de conexão | Abra o catálogo; confira o erro, volte a Normal e tente novamente.                                       |
| Falha de favorito           | Autentique, abra um NFT e alterne o coração; o estado anterior é restaurado.                             |
| Cupom expirado              | Adicione um NFT ao carrinho e aplique KURIO10; confira o erro de expiração.                              |
| Preço alterado              | Com item no carrinho, conecte a carteira simulada, revise e confirme; a mudança exige nova revisão.      |
| Pagamento recusado          | Faça a compra simulada; o resultado é recusado e os itens permanecem no carrinho.                        |
| Timeout após criar pedido   | Confirme uma compra; aguarde a recuperação do pedido e recarregue o recibo para conferir o mesmo ID.     |
| Pedido pendente             | Confirme a compra e recarregue; o mesmo pedido permanece pendente e conclui após cerca de 60 segundos.   |
| Expirar sessão              | Autentique, clique em Expirar sessão e abra perfil ou pagamento; entre novamente para retomar o destino. |

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

A suíte completa foi validada em Windows com Chromium. As baselines visuais usam o sufixo `win32`; Linux/macOS procuram arquivos de referência próprios e podem rasterizar fontes de modo diferente. Não atualize snapshots apenas para contornar uma diferença sem revisão. Em Linux, se faltarem bibliotecas do navegador, use `pnpm exec playwright install --with-deps chromium`.

Baselines: `tests/e2e/*-snapshots`. Exports originais do Figma: `tests/visual/references`. Atualize baselines apenas após revisão visual:

```sh
pnpm test:e2e --update-snapshots
```

O relatório HTML é gerado em `playwright-report`; traces e screenshots de falhas ficam em `test-results`. A rodada posterior às orientações dos formulários e à correção de retomada de abas passou os **114 testes: 38 cenários nos três tamanhos**, incluindo **15 verificações visuais**; sua cópia HTML está em `reports/playwright/index.html`. Para abrir a cópia entregue sem executar testes, use `pnpm exec playwright show-report reports/playwright`. Esta rodada não alterou snapshots, tolerâncias ou asserções de geometria do Figma. Dois traces históricos de diferenças visuais já resolvidas foram preservados em `reports/playwright/historical-failures`; abra um ZIP com `pnpm exec playwright show-trace caminho/do/arquivo.zip`. Não representam falhas da rodada aprovada. As baselines não afirmam equivalência absoluta de pixels com o Figma. Os relatórios Lighthouse versionados pertencem à rodada de performance anterior às últimas correções funcionais.

Os PNGs originais foram preservados e têm cópias AVIF de alta qualidade para entrega, reduzindo aproximadamente 8 MB para 0,85 MB nas quatro artes em resolução original. Cards e galeria também oferecem variantes de 384/768px por `srcset`/`sizes`; a versão de 1254px continua disponível para telas maiores e zoom. Logo, ícones e imagens são locais. A fonte Roboto Mono também é empacotada localmente.

## Configuração e limites

`VITE_ENABLE_MOCKS` é `true` por padrão, inclusive no build de demonstração. `VITE_ENABLE_MOCKS=false` permite preparar uma integração externa; `VITE_API_URL` configura a base HTTP. O desafio entregue utiliza os mocks, não um backend real. Nenhuma variável `VITE_*` deve conter segredos.

A sessão e a base simulada ficam no armazenamento local. Senhas são derivadas com PBKDF2, não armazenadas em claro; isso **não transforma o frontend em um serviço seguro de autenticação real**. Use apenas dados fictícios. MSW e Web Locks exigem navegador moderno e contexto seguro: localhost ou HTTPS.

As integrações editoriais, sociais e de suporte fora do escopo exibem aviso coerente; não simulam sucesso. As conexões Socket.IO simuladas são locais à aba; não há sincronização de eventos entre dispositivos. A persistência compartilhada por abas usa Web Locks para evitar sobrescritas concorrentes.

Versão pública: [frontend-challenge.diego-9090dd.workers.dev](https://frontend-challenge.diego-9090dd.workers.dev). A versão integrada em `5736fe8` foi conferida no Edge: fallback SPA, acesso direto, filtros, login, cupom, compra, refresh do mesmo recibo e isolamento de pedidos. Um smoke separado em Chromium passou em 1440/768/390px, incluindo eventos Socket.IO. Isso não representa uma execução da suíte completa na hospedagem. As orientações dos formulários e a recuperação após suspensão da aba são posteriores a essa conferência; precisam de deploy e validação da versão publicada correspondente.

Arquitetura e contratos: [ARCHITECTURE.md](./ARCHITECTURE.md). Fidelidade e desvios: [docs/design-verification.md](./docs/design-verification.md).

Auditoria histórica da **URL pública em 22/10/2026**, após otimizar a carga inicial e antes desta revisão: performance **93/94 no mobile (Home/detalhe) e 100 no desktop**, com acessibilidade, boas práticas e SEO **100**. São medianas de três execuções independentes por página/perfil, com mocks ativos. Os relatórios públicos foram mantidos fora do repositório. Isso não comprova a publicação das correções posteriores.

Os relatórios locais versionados registram **91/91 mobile e 100/99 desktop** (Home/detalhe), demais categorias em 100, na confirmação de 22/10/2026. Reproduza com `pnpm build` e `pnpm run audit`. Veja [medianas](./reports/lighthouse/SUMMARY.md), [análise](./reports/lighthouse/ANALYSIS.md) e [ambiente](./reports/lighthouse/environment.json), além dos HTML/JSON individuais. Mocks, latências e configuração foram mantidos. A execução pública usa condições diferentes; as notas não isolam a causa da diferença nem garantem resultados futuros.

## Revisão de UI e interações

Perfil e carteiras seguem os campos obrigatórios do layout: preencha apelido e um ENS fictício `nome.eth`. O composto ENS tem seletor `.eth` e nome separado, aceitando também colar o nome completo. Em Carteiras, informe rede, provedor, e-mail e `DEMO` como indicação fictícia (não é cupom). O provedor no pagamento só fica disponível se existe uma carteira cadastrada dele; trocar provedor exige nova autorização simulada. Copiar a principal preenche o formulário secundário, sem compartilhar seu estado após salvar. Bases antigas não são apagadas: complete os campos novos ao salvar ou use o reset explícito.

Os formulários mostram dicas persistentes e exemplos fictícios. O endereço explica o formato da rede selecionada: Ethereum/Polygon usam `0x` + 40 caracteres hexadecimais; Solana usa 32–44 caracteres Base58. Não envie ativos aos endereços de exemplo. A sessão de demonstração dura 30 minutos: páginas privadas retornam ao login preservando o destino; páginas públicas continuam acessíveis. A recuperação do Service Worker é testada encerrando seu processo real via CDP; respostas HTML não são aceitas como dados da API e gravações não são reenviadas automaticamente.

Favicon e card social: `public/favicon.svg` e `public/og-image.png` (1200×630). Para regenerar o PNG, com `pnpm dev:mocks` ativo, execute `node scripts/generate-social-card.mjs`. Atualize as URLs absolutas de Open Graph/Twitter no `index.html` se mudar o domínio.

Na investigação de retomada da aba, uma tela genérica de erro foi reproduzida ao suspender o Service Worker: respostas HTML do fallback SPA eram tratadas como JSON e causavam exceção no cabeçalho. Esse cenário foi corrigido e recebeu testes de regressão; não se afirma que toda ocorrência histórica tenha necessariamente essa mesma causa. A recuperação de chunks permanece um caso separado, descrito no `ARCHITECTURE.md`.
