# Kurio — NFT Marketplace

Desafio frontend da Jungle Gaming: marketplace de NFTs com catálogo, compra e conta do colecionador, desenvolvido em React e TypeScript.

[Abrir aplicação](https://frontend-challenge.diego-9090dd.workers.dev)

Stack: TanStack Router, TanStack Query, Axios, Tailwind CSS, shadcn/ui, MSW, Socket.IO, Playwright e Lighthouse.

Todos os dados e pagamentos são simulados. **Use apenas dados fictícios. Não conecte carteiras reais nem envie criptomoedas.** Não é necessário backend ou serviço privado.

## Executar localmente

Ambiente utilizado: Node 22.23.1 e pnpm 11.8.0.

```sh
pnpm install --frozen-lockfile
pnpm dev:mocks
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173). A porta 5173 deve estar livre.

Não é necessário criar `.env`: os mocks estão habilitados por padrão, inclusive no build. Referência: `.env.example`.

| Variável            | Padrão | Uso                                     |
| ------------------- | ------ | --------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa a API REST e os eventos simulados |
| `VITE_API_URL`      | `/api` | Base das chamadas HTTP                  |

Não coloque segredos em variáveis `VITE_*`. A demonstração requer navegador moderno em localhost ou HTTPS.

## Contas de demonstração

| Conta | E-mail           | Senha    |
| ----- | ---------------- | -------- |
| Ana   | ana@kurio.test   | Demo123! |
| Bruno | bruno@kurio.test | Demo123! |

As contas iniciais possuem carteira Ethereum fictícia. Para testar uma compra:

1. Entre com uma conta de demonstração.
2. Escolha um NFT disponível e adicione ao carrinho.
3. Aplique `KURIO10` para obter 10% de desconto, se desejar.
4. No pagamento, autorize a conexão da carteira simulada, preencha os dados e revise o pedido.
5. Confirme a compra e confira o recibo. Recarregar a página recupera o mesmo pedido.

Novos cadastros começam sem carteira: adicione uma em **Meu perfil → Carteiras** antes de comprar. Os formulários apresentam exemplos de preenchimento. A sessão dura 30 minutos; ao expirar, páginas privadas solicitam login e preservam o destino.

O catálogo tem 36 NFTs, nove por página. A edição `1/1` de `nft-2` está indisponível e `nft-36` está esgotado. O cupom `EXPIRADO` permite testar a validação de expiração.

## Cenários de falha

Abra [/demo](http://127.0.0.1:5173/demo), selecione um cenário e execute o fluxo indicado. Volte a **Normal** entre cenários.

| Cenário                     | Como verificar                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Carregamento lento          | Abra um detalhe e observe os skeletons antes do conteúdo.                                |
| Respostas fora de ordem     | Faça buscas consecutivas; o resultado deve corresponder à última consulta.               |
| HTTP 503 / falha de conexão | Abra o catálogo, confira o erro, volte a Normal e tente novamente.                       |
| Falha de favorito           | Autentique e alterne o coração de um NFT; a alteração é desfeita após a falha.           |
| Cupom expirado              | Aplique `KURIO10` no carrinho com esse cenário ativo; confira o erro de expiração.       |
| Preço alterado              | Revise e confirme uma compra; a alteração de preço exige nova revisão.                   |
| Pagamento recusado          | Confirme uma compra; a recusa preserva os itens no carrinho.                             |
| Timeout após criar pedido   | Confirme a compra e aguarde a recuperação. Recarregue o recibo e confira o mesmo ID.     |
| Pedido pendente             | Confirme e recarregue; o mesmo pedido conclui após cerca de 60 segundos.                 |
| Expirar sessão              | Autentique, use a ação de expiração e abra perfil ou pagamento. Faça login para retomar. |

O painel também permite exercitar eventos Socket.IO de preço/disponibilidade, duplicatas, eventos antigos e reconexão.

**Restaurar cenário inicial** pede confirmação e apaga somente os dados fictícios Kurio deste navegador, incluindo cadastros, sessões, carteiras e pedidos. Recarregar a página não restaura o cenário.

## Comandos

| Comando             | Finalidade                               |
| ------------------- | ---------------------------------------- |
| `pnpm dev:mocks`    | Desenvolvimento com mocks                |
| `pnpm build`        | Verificação de tipos e build de produção |
| `pnpm preview`      | Servir o build localmente                |
| `pnpm typecheck`    | Verificação de tipos                     |
| `pnpm lint`         | ESLint sem warnings                      |
| `pnpm format:check` | Verificação de formatação                |
| `pnpm test:e2e`     | Testes E2E e regressão visual            |
| `pnpm test:report`  | Abrir o relatório da execução local      |
| `pnpm run audit`    | Auditoria Lighthouse                     |

## Testes

Instale o navegador antes da primeira execução:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

Em Linux, caso faltem bibliotecas do sistema, use `pnpm exec playwright install --with-deps chromium`.

A última execução completa registrou **114 testes aprovados**, incluindo 15 verificações visuais, em 1440, 768 e 390px. Os cenários cobrem catálogo, conta, favoritos, carrinho, compra, falhas de rede, recuperação de sessão e eventos Socket.IO.

A suíte foi validada em Windows com Chromium. As baselines visuais são específicas de Windows (`win32`); outros sistemas precisam de referências próprias revisadas. As baselines estão em `tests/e2e/*-snapshots` e os exports do Figma em `tests/visual/references`.

Para abrir o relatório entregue sem executar a suíte:

```sh
pnpm exec playwright show-report reports/playwright
```

Novas execuções geram `playwright-report`; screenshots e traces de falhas ficam em `test-results`. Os ZIPs em `reports/playwright/historical-failures` são traces de diferenças visuais já resolvidas e podem ser abertos com `pnpm exec playwright show-trace caminho/do/arquivo.zip`.

## Lighthouse

```sh
pnpm exec playwright install chromium
pnpm build
pnpm run audit
```

A auditoria inicia um preview na porta 4173 e executa três medições por página e perfil com os mocks ativos. Não execute os E2E em paralelo para evitar disputa de CPU. `pnpm run audit` executa Lighthouse; `pnpm audit` é a auditoria de dependências do pnpm.

Medianas da execução local de **22/10/2026 às 22h09 (São Paulo)**:

| Perfil                | Home | Detalhe |
| --------------------- | ---- | ------- |
| Mobile — performance  | 91   | 90      |
| Desktop — performance | 99   | 99      |

Acessibilidade, boas práticas e SEO: **100** nos quatro casos. As notas variam conforme o ambiente; o detalhe mobile está no limite da meta de performance.

Os HTMLs, JSONs, LCP, CLS, TBT e informações do ambiente estão em `reports/lighthouse`: [resumo](./reports/lighthouse/SUMMARY.md), [análise](./reports/lighthouse/ANALYSIS.md) e [ambiente](./reports/lighthouse/environment.json).

## Arquitetura

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para contratos REST e eventos, sessão, cache, carrinho, idempotência, reconciliação e decisões de interface.

Os mocks persistem dados neste navegador; não há autenticação, blockchain ou pagamento reais. Os eventos Socket.IO são locais à aba, sem sincronização entre dispositivos. Ações editoriais, sociais e de suporte fora do escopo exibem um aviso, sem simular sucesso.
