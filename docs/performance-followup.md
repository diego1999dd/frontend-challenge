# Performance local — continuação de 22/10/2026

Ponto de partida informado pelo usuário: performance mobile 91 na Home e 89 no detalhe; desktop 99/99; demais categorias 100. O relatório versionado anterior tinha LCP mediano de 3267ms no detalhe mobile.

## Mudança

O download do cliente Socket.IO começava praticamente junto com a imagem principal. A conexão agora prioriza a pintura da primeira arte, com limite de espera de um segundo para imagem lenta/quebrada, tratamento de erro e cancelamento ao desmontar ou trocar sessão. Não é uma pausa fixa nem uma condição exclusiva de auditoria.

O protocolo do simulador também saiu do bootstrap REST: `mocks/browser.ts` registra os handlers REST primeiro e carrega `realtime-transport.ts` sob demanda, antes do cliente Socket.IO. Os handlers continuam persistindo no mesmo banco e publicando pela fachada tipada; alterações anteriores à conexão são recuperadas pela reconciliação REST. Protocolo, autenticação dos eventos, deduplicação, reconexão e handlers de compra não foram substituídos por atalhos.

Scripts, configuração Lighthouse, latências MSW, assets, fontes, layout e contratos REST não foram reduzidos ou alterados para pontuar. O primeiro experimento, apenas adiando o cliente até a pintura, não mudou a mediana 89 do detalhe; a separação do adaptador do bootstrap foi mantida após medir o conjunto.

## Evidências atuais

- Primeira rodada com o adaptador lazy: performance **91/90 mobile e 100/99 desktop** (Home/detalhe), demais categorias 100.
- Confirmação após os testes: **91/91 mobile e 100/99 desktop**, demais categorias 100. LCP mediano do detalhe mobile **3034ms**, contra 3267ms no relatório versionado anterior. Cada rodada contém três amostras por página/perfil, não uma única nota escolhida.
- **99 testes aprovados**, incluindo 15 visuais, sem atualizar baselines ou tolerâncias; lint e build aprovados. O relatório HTML em `reports/playwright` é uma cópia exata da execução final aprovada.
- Smoke do build otimizado em 1440/768/390px aprovado: adaptador lazy conecta, atualização real via Socket.IO muda preço e mostra aviso, compra confirma e o recibo permanece após refresh. Nenhum erro de página nesses fluxos. O preview e os navegadores temporários foram encerrados.

Resultados e condições: [medianas](../reports/lighthouse/SUMMARY.md), [análise](../reports/lighthouse/ANALYSIS.md) e [ambiente](../reports/lighthouse/environment.json), com HTML/JSON individuais. A medição usa o build otimizado, cenários padrão e três amostras por página/perfil, sem executar E2E ao mesmo tempo.

O teste adicional em `tests/e2e/performance.spec.ts` verifica espera por imagem, cancelamento e fallback. Os fluxos existentes continuam verificando eventos reais via Socket.IO/MSW, isolamento, recuperação e compra. Nenhuma baseline ou tolerância visual foi atualizada nesta rodada.

Esta continuação está organizada em commits na branch `fix/ui-review` para envio ao repositório. Não inclui merge em `main` nem novo deploy. Pontuações próximas de 90 podem oscilar; o resultado não é garantia de nota idêntica em outra máquina ou execução.
