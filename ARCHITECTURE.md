# Arquitetura e contratos — Kurio

## Organização

```text
src/
  components/          # Header, Footer, campos, feedback, quantidade, cards e shadcn
  layouts/             # Shell compartilhado e estado global acessível
  features/
    catalog/           # Descoberta e detalhe
    account/           # Sessão, perfil, carteiras e favoritos
    commerce/          # Carrinho, cotação, checkout, pedidos e painel demo
  lib/                 # Axios, QueryClient, ETH, assets e helpers
  mocks/               # Banco fictício persistido, REST e Socket.IO simulados
  realtime/            # Cliente Socket.IO, versões e reconciliação REST
  styles/              # Tokens centrais e composição responsiva por contexto
tests/e2e/             # Fluxos reais de UI e baselines Playwright
scripts/audit.mjs      # Lighthouse pelo Chromium do Playwright
```

O padrão visual segue a organização solicitada a partir do YESS: paleta central em `global.css`, aliases shadcn, layout compartilhado, componentes repetidos reutilizados e páginas compostas por seções. `marketplace.css`, `detail.css`, `account.css` e `commerce.css` contêm a composição, sem duplicar uma paleta por página.

Componentes não importam fixtures. REST passa por Axios, consultas/mutations por TanStack Query e rotas/parâmetros/proteção por TanStack Router. Os mocks ficam exclusivamente na camada de rede. A fonte e os assets são locais.

## Sessão e isolamento

`GET /session` é a referência para recuperar usuário e expiração. O token fictício fica em `kurio-demo-session`. Requests recebem `Authorization: Bearer …` e `X-Visitor-Id` pelo interceptor Axios. O visitante tem identificador próprio, sem acesso a recursos privados.

Chaves privadas têm prefixo `['private', userId, recurso]`; cotações também incluem identidade, revisão do carrinho e rede. Login/logout/troca/expiração cancelam consultas e removem caches sensíveis, inclusive carrinho e cotações. Uma resposta 401 `SESSION_EXPIRED` da sessão vigente dispara limpeza e redirecionamento. Falha de login usa outro código e não apaga a sessão por engano.

A proteção consulta o cache da sessão também durante a transição de rota, evitando uma corrida entre a notificação em lote do Query e a navegação após login. O destino de retorno é capturado por montagem e aceita somente caminhos internos; não permite URLs externas ou loop para login/cadastro.

Perfil, carteiras, favoritos e pedidos validam o proprietário no mock. Pedidos de outro usuário retornam 404, sem revelar seu conteúdo. As senhas fictícias usam PBKDF2/SHA-256, 100 mil iterações e salt; não há senha em claro no banco. A API simulada não é uma solução de autenticação para usuários reais.

Na revisão de UI de 22/10, ENS e apelido do perfil passaram a ser obrigatórios conforme os asteriscos do frame. Carteiras também validam e-mail, ENS e indicação fictícia, além dos campos anteriores; `DEMO` pode preencher a indicação. `secondaryAddress` é opcional e aceita ENS/endereço público. O composto ENS serializa nome/sufixo em uma string `.eth`, sem resolver registros reais. As contas iniciais têm valores válidos; bases existentes não são apagadas ou preenchidas silenciosamente. Campos antigos vazios precisam ser completados ao salvar. Copiar a principal apenas preenche o formulário secundário; a API cria um recurso independente. Trocar de provedor no checkout invalida a conexão anterior, mesmo ao cancelar a nova autorização.

## REST

Os tipos compartilhados estão em `features/catalog/contracts.ts` e `features/account/contracts.ts`.

| Recurso             | Operações                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/session`          | GET sessão; POST login; DELETE logout                                                                            |
| `/accounts`         | POST cadastro, com conflito e validações                                                                         |
| `/nfts`             | GET com `q`, `category`, `sort`, `page`, `network`, `min`, `max`; retorna itens, total, página, tamanho e facets |
| `/nfts/:id`         | GET detalhe ou 404                                                                                               |
| `/favorites`        | GET IDs do usuário                                                                                               |
| `/favorites/:id`    | PUT inclusão idempotente; DELETE remoção                                                                         |
| `/cart`             | GET carrinho com itens enriquecidos e revisão                                                                    |
| `/cart/items`       | POST NFT/edição/quantidade                                                                                       |
| `/cart/items/:id`   | PUT quantidade; DELETE remoção                                                                                   |
| `/cart/coupon`      | PUT `{ code }`; string vazia remove                                                                              |
| `/quotes`           | POST `{ network }`; retorna itens, subtotal, desconto, taxa, total, identidade e validade                        |
| `/orders`           | POST idempotente; GET pedidos próprios, opcionalmente filtrados por `key`                                        |
| `/orders/:id`       | GET estado e recibo próprios                                                                                     |
| `/profile`          | GET e PUT dados/avatar; alteração de senha opcional validada antes de salvar                                     |
| `/profile/password` | PUT senha atual, nova senha e confirmação                                                                        |
| `/wallets`          | GET carteiras do usuário                                                                                         |
| `/wallets/:id`      | PUT alteração; `new` cadastra, até duas carteiras                                                                |

Erros seguem `{ code, message, fields? }`: 401 sessão/credenciais, 404 recurso, 409 conflito/cotação/idempotência, 422 validação/cupom e 503 falha transitória. Respostas de validação dos formulários são associadas aos respectivos campos. IDs e recursos são verificados na API, não apenas na UI.

Preços ETH trafegam como strings decimais, com até 18 casas. Cálculos e ordenação monetária usam BigInt em wei. A API fornece também os totais de cada linha; a UI não recalcula taxas nem descontos em float.

## Carrinho, cotação e pedido

Carrinhos ficam separados por visitante ou usuário e são persistidos no mock. O login mescla o carrinho visitante no autenticado, respeita o estoque e preserva o cupom quando não há outro no destino. A revisão muda a cada alteração.

Cada cotação tem validade de dois minutos e fingerprint dos itens, quantidades, versões/preços, disponibilidade, rede e cupom. O checkout mantém uma cópia da cotação revisada. Atualização durante a revisão invalida a confirmação; o POST do pedido revalida tudo mesmo se a UI estiver desatualizada.

`POST /orders` exige `Idempotency-Key`. A mesma chave e conteúdo canônico recuperam o mesmo pedido; conteúdo diferente gera 409. A chave da tentativa fica persistida por usuário. Após timeout, o cliente consulta a tentativa antes de criar outra compra. Pedidos pendentes sobrevivem a refresh pelo `readyAt` persistido; a consulta reconcilia a conclusão quando o timer da aba anterior não existe mais.

O cenário `payment-pending`, disponível em `/demo`, mantém o pedido pendente por 60 segundos para reproduzir interrupções. O E2E desconecta o Socket.IO durante essa pendência, recarrega, avança o relógio e verifica o mesmo ID confirmado e uma única compra, inclusive após replay. A restauração consulta os handlers REST; não injeta um estado confirmado na interface.

As contas fictícias iniciais usam hashes PBKDF2-SHA256 pré-calculados nas fixtures (100.000 iterações e os mesmos salts v2), evitando repetir um cálculo constante em cada inicialização. Login, cadastro e troca de senha continuam derivando/verificando os hashes. Bases existentes e senhas alteradas não são sobrescritas. O CSS de comércio é uma dependência lazy das telas que o utilizam, não um stylesheet bloqueante da Home/detalhe. Relacionados, já ocultos por design no mobile, não consultam nem renderizam um catálogo invisível nesse tamanho; a seção continua ativa em desktop/tablet e ao redimensionar. A arte completa não aplica um recorte CSS nulo; os recortes só são aplicados ao selecionar uma vista de detalhe, sem reduzir resolução ou qualidade.

A galeria do contrato NFT contém imagens e enquadramentos (`image`, `label`, `inset`). As fixtures oferecem a arte completa e três detalhes da mesma arte usando `object-view-box`, também aplicado no zoom. Não representam NFTs diferentes. Catálogos persistidos antigos recebem apenas esses metadados faltantes, preservando preço, estoque, contas e pedidos. Miniaturas têm seleção e teclado e também ficam disponíveis no mobile. A interface aceita fallback de uma imagem para contratos sem galeria.

O retorno após autenticação rejeita caminhos externos, barras invertidas e caracteres de controle. O reflow é testado em larguras CSS de 720, 384 e 320px, equivalente à redução do espaço disponível com zoom de 200% (limitado a 320px). Isso não é um teste de zoom físico em dispositivo móvel. Em larguras menores que 390px, os filtros do catálogo quebram linha e o destaque e a compra se reorganizam sem esconder conteúdo para mascarar overflow.

Transições nativas só são habilitadas quando existe uma página anterior e o pathname muda. Carga inicial, filtros e navegação pelo histórico no mesmo pathname não criam snapshots de transição; isso evita atraso inicial e interferência com controles de filtro. A preferência de movimento reduzido é consultada em cada mudança.

Somente o mock altera `pending` para `confirmed` ou `declined`. Estados terminais não são revertidos. Na confirmação, o estoque é descontado e apenas os itens/quantidades comprados saem do carrinho. Recusa mantém o carrinho. O recibo guarda cópias dos itens, preços, descontos, taxa, carteira e dados do colecionador; mudanças posteriores no catálogo não alteram seu valor.

As operações do banco e a conclusão dos pedidos usam Web Locks para impedir que uma requisição grave uma cópia antiga sobre dados mais recentes. A latência do cenário de timeout é aplicada depois de liberar a transação, permitindo recuperar o pedido enquanto a resposta original falha.

## Cache, falhas e otimista

Consultas públicas usam staleTime de 30 segundos e gcTime de cinco minutos. Sessão e cotação têm staleTime de 15 segundos. Foco de janela revalida dados. A cotação é invalidada por mutations/eventos; seu prazo e fingerprint são verificados novamente no servidor simulado.

Queries repetem uma vez falhas de transporte/5xx; 4xx não repetem. Sessão e cotação não repetem automaticamente. Mutations não têm retry automático. AbortSignal chega ao Axios; busca/filtros compõem a query key completa, evitando aplicar respostas de outra busca.

Favoritos usam atualização otimista com snapshot anterior, rollback e invalidação. O rollback confere a identidade da sessão para não restaurar cache de um usuário que já saiu. Controles sinalizam a mutation pendente; testes de persistência aguardam a confirmação da API, não apenas o estado otimista.

## Retomada de abas e validação do transporte

A suspensão do processo do Service Worker pode apagar o conjunto de clientes ativos mantido em memória pelo MSW. Na reprodução com `ServiceWorker.stopAllWorkers` (CDP), a próxima consulta recebia o HTML do fallback SPA e era interpretada como carrinho, causando uma exceção no cabeçalho. O Axios agora rejeita respostas sem JSON estruturado antes de entregá-las ao Query. Nos mocks, uma recuperação compartilhada reativa o cliente pelo handshake `MOCK_ACTIVATE` / `MOCKING_ENABLED` do `public/mockServiceWorker.js` versionado, com limite de três segundos e limpeza do listener. Essa dependência do protocolo do MSW deve ser revalidada ao atualizar o pacote/worker; não se altera o arquivo gerado. Não usamos `worker.stop()` na retomada, pois ele substituiria o interceptor WebSocket capturado pelo Socket.IO.

Somente consultas GET/HEAD/OPTIONS podem ser repetidas automaticamente, uma vez por requisição, após o reconhecimento da reativação. Gravações não são reenviadas automaticamente e não aparentam sucesso quando recebem HTML; o usuário recebe erro recuperável. Pedidos continuam usando sua recuperação por chave de idempotência. Não há reload da página, reset de dados ou simulação direta de estado. Os testes encerram o processo real do Service Worker e verificam retomada antes da expiração, expiração após 31 minutos com retorno ao pagamento e carrinho preservado, Socket.IO funcional e ausência de reenvio automático de mutation. O cenário foi reproduzido no build local e na versão publicada anterior; a correção precisa de novo deploy para valer na hospedagem.

## Socket.IO

As definições de rotas e a sessão têm imports estáticos para que o Vite descubra suas dependências no HTML. Páginas secundárias de conta/compra usam `React.lazy` e `Suspense`. No build com mocks, um plugin adiciona `modulepreload` ao bootstrap MSW e suas dependências: antecipa download/compilação, não a ativação do worker. React só é montado após `worker.start()` concluir.

Depois de ativar o MSW, o bootstrap antecipa a consulta pública da URL inicial usando as mesmas opções, filtros interpretados pelo Router e cache TanStack Query da página. No detalhe, a resposta permite antecipar a arte principal com o mesmo `srcset`/`sizes` do componente; não há importação de fixtures nem desvio da API.

`socket.io-client` é importado pelo efeito montado depois da sessão, das primeiras consultas públicas e da pintura da arte inicial. A espera pela imagem tem limite de um segundo e trata erro; duas oportunidades de frame permitem apresentar a imagem antes de carregar/parsing do cliente. Sem imagem, a conexão segue após os frames; não há uma pausa fixa de um segundo. A espera é cancelada em logout/desmontagem e não é repetida em refetches posteriores.

O worker MSW inicia imediatamente com os handlers REST. Seu adaptador Socket.IO (`realtime-transport.ts`) é um módulo lazy registrado por `enableRealtimeMock()` antes de criar o cliente, com inicialização compartilhada entre chamadas. A fachada `mocks/realtime.ts` mantém os publicadores dos handlers REST sem importar o protocolo na carga inicial. Antes do adaptador existir não há destinatário conectado; os handlers já persistiram a alteração no banco. A reconciliação REST ao conectar recupera o estado corrente, inclusive mudanças durante a abertura. Não há fila de eventos antigos reaplicados nem setters de UI substituindo a conexão. Falha ao carregar o transporte mantém o indicador desconectado, sem sucesso falso.

Transporte WebSocket real do cliente, namespace padrão, com protocolo adaptado por `@mswjs/socket.io-binding`. MSW 2.10 normaliza `/socket.io/` para `/` ao fazer matching; o handler confere o pathname original e libera conexões de desenvolvimento do Vite.

| Evento          | Envelope e efeito                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `nft.updated`   | `eventId`, `resourceId`, `version`, `nft`; invalida catálogo, detalhe, carrinho e cotação                          |
| `order.updated` | `eventId`, `resourceId`, `userId`, `version`, `order`; invalida pedidos/carrinho/cotação do usuário correspondente |

O mock publica pedidos somente para conexões com sessão vigente do proprietário. O cliente também confere o usuário e ignora versões duplicadas/antigas. Não há setters de sucesso substituindo o socket. REST permanece a fonte de verdade. Reconexão invalida recursos ativos; pedidos pendentes têm consulta de recuperação a cada três segundos como fallback. Troca de usuário desmonta a conexão, remove listeners e inicia outra sessão de eventos. Heartbeats são encerrados no fechamento.

Limitações: simulação por aba, sem backend, rooms, polling Engine.IO, extensão de carteira ou blockchain. O armazenamento pode ser compartilhado entre abas no mesmo navegador, mas o broadcast Socket.IO não é sincronizado entre abas/dispositivos.

## Cenários e reprodução

`/demo` seleciona o cenário pelo MSW. Endpoints de operação/teste:

- `POST /demo/scenario` com `{ scenario }`; `GET /demo/scenario` consulta.
- `POST /demo/reset` restaura somente os dados Kurio.
- `POST /demo/expire` expira a sessão fictícia.
- `POST /demo/nfts/:id/update` altera estoque/preço, incrementa versão e emite evento. Aceita `price`, `available`, `duplicate` e `stale`.
- `POST /demo/socket/disconnect` interrompe o transporte para exercitar reconexão.
- `POST /demo/orders/:id/replay` repete o evento e emite uma versão antiga para verificar tolerância.

Os mocks são os mesmos em desenvolvimento, build e testes. O banco tem chave versionada `kurio-demo-db-v2`; o reset restaura integralmente usuários, estoque, cenários e recursos privados. Credenciais e instruções estão no README.

## Visual, acessibilidade e limites da entrega

Os frames e assets foram lidos pelo Figwright 0.6.0; nenhuma alteração foi feita no Figma. Componentes shadcn foram adaptados à identidade Kurio. O checkout mobile prioriza carteira e mantém os dados do colecionador em diálogo com foco controlado; a revisão é um estado adicional necessário ao enunciado.

Há labels, mensagens de erro, foco visível, links de retorno, diálogos Radix, feedback live e skeletons com movimento reduzido. O skeleton do detalhe compartilha a geometria da tela para evitar salto de layout. As cópias AVIF mantêm a composição das artes, com variantes de 384/768px e original de 1254px escolhidas por `srcset`/`sizes`. Os PNGs originais continuam disponíveis; o layout não muda com a resolução do arquivo entregue.

A verificação usa Chromium em desktop/tablet/mobile e screenshots versionadas. Perfis, carteiras e recibo também são responsivos, com adaptação inferida onde não há frame mobile. Desvios e referências estão em `docs/design-verification.md`. Métricas e condições de medição ficam em `reports/lighthouse`.

Revisão de interações: foco de inputs é indicado internamente, enquanto links/botões preservam foco visível por teclado. Favoritos usam preenchimento/estado acessível. Carrosséis têm controles reais de pelo menos 24×24px, sem autoplay; no histórico, a faixa do slider é reidratada da URL. CSS e View Transitions nativas do Router fornecem movimentos curtos, respeitando movimento reduzido, sem biblioteca extra. A Home não recebe animação de entrada. Avisos de eventos expiram em seis segundos; o estado reconciliado não é revertido quando o aviso desaparece.

O evento `vite:preloadError` tenta recarregar uma vez por minuto para recuperar chunks removidos por um novo deploy. Foi verificado no build com uma resposta HTTP 404 controlada para a primeira requisição real de uma página lazy, recuperando também a sessão. Falhas repetidas não entram em loop; a tela de erro oferece recarga explícita. Isso não identifica a causa da captura genérica de `CORRECOES.md`, que não foi reproduzida espontaneamente. Decisões e resultados estão em `docs/corrections-review.md`.

Uma versão anterior foi publicada pelo usuário na Cloudflare; fallback SPA, login, compra e refresh do recibo foram verificados no Edge. As otimizações de carregamento desta rodada foram verificadas localmente e ainda precisam ser publicadas. A auditoria de dependências de produção anteriormente não apontou vulnerabilidades no ambiente verificado; dependências de desenvolvimento da ferramenta Lighthouse tinham alertas transitivos, reproduzíveis com `pnpm audit`. Essa observação histórica não substitui uma nova auditoria de dependências. Essas ferramentas não são importadas pela aplicação publicada.
