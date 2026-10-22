# Tokens revisados

Fonte local: `src/styles/global.css`. Os nomes do shadcn são aliases da paleta; não constituem uma segunda paleta.

| FigmaName            | ref                          |
| -------------------- | ---------------------------- |
| color/ink            | var(--color-background)      |
| color/surface-raised | var(--color-surface-alt)     |
| color/surface-dark   | var(--color-surface-dark)    |
| color/secondary      | var(--color-secondary-brand) |
| font/family          | var(--font-sans)             |

Valores conferidos: `#140D0A`, `#2F1D15`, `#38220F`, `#B39463` e Roboto Mono, respectivamente. Os demais tokens de correspondência direta permanecem na fonte local, sem duplicar uma segunda paleta aqui.

A sugestão automática de `color/secondary` para `--color-secondary` foi rejeitada: este último é uma superfície shadcn. Candidatos apenas por nome, sem valor correspondente, não foram aceitos.
