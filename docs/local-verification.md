# Verificação local — 21/10/2026

## Resultado

- Suíte completa Playwright: **57 testes passaram**, sem atualização de snapshots, em Chromium desktop (1440px), tablet (768px) e mobile (390px; capturas de referência em 414px).
- Após restringir a detecção do Tailwind a `src`, as **15 verificações visuais passaram novamente**, sem alteração de baselines. Isso impede que relatórios HTML/JS gerados modifiquem o CSS da aplicação.
- TypeScript, ESLint e build de produção passaram.
- Smoke test contra o build servido em `127.0.0.1:4173`: catálogo → detalhe → carrinho visitante → login → checkout → recibo confirmado → refresh, em 1440px e 390px. Ambos passaram sem `pageerror` no navegador.
- Lighthouse: performance desktop 99 nas duas páginas; mobile 89 na Home e 88 no detalhe, abaixo da meta de 90. Acessibilidade, boas práticas e SEO: 100 em todos os perfis. A justificativa e a oportunidade de otimização estão em `reports/lighthouse/ANALYSIS.md`.
- `pnpm audit --prod`: nenhuma vulnerabilidade conhecida encontrada. O Lighthouse tem dependências transitivas de desenvolvimento com alertas; veja `pnpm audit`. Não são dependências de runtime da aplicação.
- Exportações Figma preservadas em `tests/visual/references`; diferenças deliberadas documentadas em `design-verification.md`.

## Relatórios

- `reports/playwright/index.html`: rodada completa aprovada de 57 testes.
- `playwright-report/index.html`: última rodada executada, substituída a cada execução.
- `reports/playwright-reviewed-failures/index.html`: histórico de duas diferenças de snapshot já revisadas/resolvidas, com screenshots e traces. A causa foi a substituição do label que envolvia o textarea por um label explicitamente associado ao campo. Não são defeitos pendentes.
- `reports/lighthouse/SUMMARY.md`: medianas de três medições de início/detalhe, em mobile/desktop. HTML, JSON e ambiente estão na mesma pasta.

## Limites

Os testes usam os handlers MSW e o cliente Socket.IO da aplicação. Não substituem a validação em uma URL pública. Repositório, deploy e envio do teste não foram executados, conforme a orientação para preparar apenas localmente. A publicação ainda é uma etapa obrigatória do enunciado.

Também não se afirma equivalência absoluta de pixels entre Figma e Chromium/Windows, nem autenticação, blockchain ou pagamento reais. As decisões, contratos e limitações estão em `ARCHITECTURE.md`.
