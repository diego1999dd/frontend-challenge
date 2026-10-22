# Análise das auditorias locais

Medição em 21/10/2026, build de produção servido por Vite Preview, MSW e Socket.IO ativos, cenário padrão e três execuções sequenciais por página/perfil. Os E2E não rodaram em paralelo. Versões, hardware e condições estão em `environment.json`; as medianas completas estão em `SUMMARY.md`. Os relatórios individuais HTML/JSON foram preservados, inclusive quando a nota ficou abaixo da meta.

## Metas e resultados

| Categoria      | Meta | Home mobile     | Detalhe mobile  | Home desktop | Detalhe desktop |
| -------------- | ---- | --------------- | --------------- | ------------ | --------------- |
| Performance    | ≥ 90 | **89 — abaixo** | **88 — abaixo** | 99           | 99              |
| Accessibility  | ≥ 95 | 100             | 100             | 100          | 100             |
| Best Practices | ≥ 95 | 100             | 100             | 100          | 100             |
| SEO            | ≥ 90 | 100             | 100             | 100          | 100             |

As notas automáticas de acessibilidade não substituem a verificação por teclado, foco e labels exercitada pelos E2E. Os resultados são locais e não garantem a mesma nota em hospedagem pública ou em outro equipamento.

## Por que o mobile está abaixo de 90

O limitante observado é o **LCP**, não longas tarefas bloqueantes: medianas de 3.249 ms na Home e 3.498 ms no detalhe, com TBT de 22 e 30 ms. O CLS foi 0,0486 e 0,0000, respectivamente.

- Na Home, o Lighthouse identifica o fundo SVG da navegação mobile como elemento LCP. Na primeira medição, aproximadamente 1.909 ms estão na fase de renderização após carregar o recurso. A navegação só é montada depois do bootstrap React/MSW. O recurso já tem preload no mobile; o atraso não é explicado apenas pelo tamanho da imagem.
- No detalhe, a primeira medição atribui aproximadamente 2.706 ms ao atraso até iniciar o carregamento da arte principal, e 182 ms à transferência. A descoberta da imagem depende da montagem da aplicação e da resposta REST simulada. Os chunks iniciais incluem React/Router/Query, os mocks e código de páginas de conta/compra. O relatório também aponta JavaScript não utilizado na carga inicial.

A cadeia de inicialização e a descoberta tardia da arte são causas prováveis inferidas dessas fases e da implementação, não uma medição isolada do custo de cada biblioteca. MSW permanece ativo, com a mesma persistência e funcionalidades da demonstração; não foi removido nem contornado para melhorar a nota.

## Melhorias já aplicadas

- Artes AVIF em alta qualidade, preservando os PNGs originais e a resolução.
- Fonte local e preload da variante Latin; preload do fundo da navegação mobile.
- Download dos módulos da aplicação em paralelo à inicialização do MSW; conexão Socket.IO criada somente após o worker estar pronto.
- Dimensões intrínsecas dos ícones e skeleton do detalhe com a geometria do conteúdo.
- Detecção de classes Tailwind restrita a `src`, sem varrer relatórios gerados.
- `robots.txt` real e hierarquia de headings ajustada.

## Próxima otimização recomendada

Separar páginas de conta/compra em chunks sob demanda e medir novamente a cadeia inicial sem alterar o comportamento dos mocks. Também avaliar a descoberta antecipada da arte do detalhe e variantes responsivas das imagens. Essas otimizações adicionais **não estão implementadas** nesta rodada. Não se afirma que a meta mobile de performance foi atingida.
