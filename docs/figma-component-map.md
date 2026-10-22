# Mapeamentos revisados

| FigmaName  | code/path                                           |
| ---------- | --------------------------------------------------- |
| Header Row | src/components/header.tsx                           |
| Filters    | src/features/catalog/components/catalog-filters.tsx |

Header Row (`70486:560`): `Active` corresponde a `active`; o badge usa a quantidade real do carrinho. Filters (`70485:381`): implementação revisada substitui o candidato automático de baixa confiança.

O divisor do Header fica no mesmo componente local. Ícones são assets SVG consumidos por `Icon`, não novos componentes de negócio. Nenhum mapeamento automático por similaridade de nome foi considerado confirmação visual.
