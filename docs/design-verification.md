# Verificação visual — Kurio

Referência: arquivo `Frontend Challenge (Copy)`, página `Marketplace de NFTs GreenMint`. Leituras de medidas, layout, tipografia e assets pelo Figwright; plugin/servidor 0.6.0 confirmados em 21/10/2026. Nenhum frame do Figma foi alterado.

## Escopo implementado

| Tela                | Frame   | Tamanho     |
| ------------------- | ------- | ----------- |
| Home desktop        | 2:2     | 1440 × 3668 |
| Detalhe desktop     | 10:244  | 1440 × 2246 |
| Home mobile         | 14:5226 | 414 × 896   |
| Detalhe mobile      | 15:5536 | 414 × 896   |
| Login desktop       | 9:115   | 1440 × 1981 |
| Cadastro desktop    | 9:1022  | 1440 × 1981 |
| Perfil desktop      | 9:1238  | 1440 × 1080 |
| Carteiras desktop   | 9:1670  | 1440 × 1080 |
| Carrinho desktop    | 11:1278 | 1440 × 1754 |
| Checkout desktop    | 11:2862 | 1440 × 1657 |
| Confirmação desktop | 11:4385 | 1440 × 1657 |
| Login mobile        | 16:1022 | 414 × 896   |
| Cadastro mobile     | 16:1228 | 414 × 896   |
| Carrinho mobile     | 16:360  | 414 × 896   |
| Checkout mobile     | 16:748  | 414 × 896   |

`get_motion_context` percorreu integralmente os quinze frames listados; nenhum contém animações. O shimmer de carregamento é um estado da aplicação, não uma animação atribuída ao design. As seções internas dos formulários, tabela do carrinho e resumo de pagamento foram lidas separadamente para obter o contexto completo sem truncamento.

## Medidas verificadas no navegador

No desktop, conteúdo de 1200px, margem lateral de 120px, topo de 24px e espaçamento vertical principal de 96px. Asserções automatizadas verificam os valores abaixo, independentes das screenshots geradas pela aplicação:

| Home     | Y    | Altura |
| -------- | ---- | ------ |
| Hero     | 101  | 450    |
| Catálogo | 647  | 1373   |
| Promos   | 2116 | 250    |
| Diário   | 2462 | 476    |

| Detalhe            | Y    | Altura |
| ------------------ | ---- | ------ |
| Galeria            | 129  | 448    |
| Descrição          | 673  | 340    |
| Mais desta coleção | 1109 | 407    |

Mobile Home: margem de 24px, busca de 45px, hero de 366×190px a partir de Y=101, cards em duas colunas com deslocamento de 32px na coluna direita. Detalhe mobile: galeria de 414×506px, ficha iniciando em Y=392 e barra de compra fixa de 164px.

## Assets e reutilização

Quatro imagens originais de 1254×1254px são compartilhadas por hero, cards, galeria, promos e diário, com recortes próprios da composição. Estão em `public/images/nfts`, preservando o hash de origem. A aplicação mantém AVIF em 1254px e oferece variantes de 384/768px nos cards e galeria por `srcset`/`sizes`; os PNGs originais foram preservados. As variantes mantêm a composição e codificação RGB, sem alterar a geometria do layout. Logotipo: SVG `70486:510`, com export próprio para o login mobile. Ícones e fundo da navegação mobile: SVGs exportados em `public/images/icons`.

`Header`, `Footer`, `NftCard`, `NftArtwork`, `NftPrice`, `QuantitySelector`, filtros e diálogos são reutilizados entre contextos. Conta e compra compartilham campos, seleção, erros, resumo de cotação e itens do recibo. As seções coordenam os dados; os cards não importam fixtures. Paleta central em `global.css`, sem repetir cores de marca em JSX.

## Referências e testes

Exports originais: `tests/visual/references`. Baselines Chromium/Windows: `tests/e2e/visual.spec.ts-snapshots` e `tests/e2e/commerce-visual.spec.ts-snapshots`. Home, detalhe, login, carrinho e checkout têm capturas automatizadas. Para verificar regressão, executar `pnpm test:e2e`. Atualizar baselines somente após revisar a alteração: `pnpm test:e2e --update-snapshots`.

As baselines são capturas da implementação e não afirmam equivalência pixel a pixel com o Figma. A inspeção compara os exports do Figma com o navegador. Há cobertura de 1440px, 768px, 390px e capturas mobile em 414×896; 768/390 são adaptações fluidas, sem frame original nesses tamanhos.

Na primeira rodada de desempenho em 22/10/2026, oito baselines de detalhe/carrinho/checkout foram atualizadas após revisar a rasterização das imagens responsivas. Na revisão posterior de `CORRECOES.md`, treze baselines receberam os ajustes de botões, campos, foco, footer, navegação e carrosséis; as diferenças foram revisadas antes da atualização. As medidas verificadas dos frames desktop e as tolerâncias de screenshot foram preservadas. Os pontos dos carrosséis mantêm 7/8/12px, com controles e espaçamento ampliados para alvos de ao menos 24×24px por acessibilidade. Veja `docs/corrections-review.md` para decisões e cobertura.

## Diferenças e limites deliberados

- Na revisão final, a galeria passou a oferecer enquadramentos reais da mesma arte. As miniaturas mobile são uma extensão funcional acessível do frame; não foram adicionadas imagens de outros NFTs. Os três snapshots de detalhe foram revisados, mantendo as asserções de geometria desktop e as tolerâncias anteriores.
- Há adaptação adicional abaixo de 390px para reflow, com quebra de linha dos filtros e destaque mais compacto, sem ocultação global de overflow.

- As contagens de coleções/redes vêm das 36 fixtures, não dos números ilustrativos do Figma. O badge do carrinho reflete os itens reais da sessão, iniciando vazio.
- O oitavo card desktop sem legenda no Figma recebe nome/preço para manter o catálogo utilizável e acessível.
- O detalhe mobile usa a opção semântica `1/1` da referência desktop; não duplica o texto `1/10` do frame mobile.
- A Home continua rolável além dos 896px do frame mobile; a moldura arredondada de dispositivo não é aplicada ao documento web.
- O controle de faixa de preço tem limites reais e teclado; a posição do thumb reflete esses limites, não um desenho estático.
- Rasterização de texto varia entre Figma e Chromium/Windows; a fonte real carregada foi confirmada como Roboto Mono pelo navegador. Não se reivindica igualdade absoluta de pixels.
- Login, cadastro, perfil, carteiras, favoritos, carrinho, checkout e pedidos estão implementados com persistência local. A confirmação aparece somente após o pedido simulado chegar ao estado confirmado.
- Estados de erro, confirmação de carteira, revisão da cotação, pedidos e adaptações mobile sem frame específico são extensões funcionais, não cópias de telas inexistentes no Figma. Não há campos de entrega física para NFTs.
- O checkout mobile prioriza carteiras como na referência; dados do colecionador ficam em diálogo acessível. Preços, estoque, quantidades e totais vêm do mock, não dos números ilustrativos dos frames.
- Relatórios locais ficam em `reports/lighthouse`; a medição usa o build de produção com mocks ativos. Uma versão anterior foi publicada e verificada no Edge; seus relatórios históricos foram arquivados fora do repositório. As correções de UI desta revisão ainda precisam ser integradas e publicadas.
