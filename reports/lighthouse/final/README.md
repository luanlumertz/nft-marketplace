# Lighthouse — fechamento e carregamento dos filtros

Auditoria de 26/11/2026, código funcional `e0805fe`, após a separação de busca/filtros. Build otimizado, cenário padrão MSW, fontes e imagens reais, REST e Socket.IO habilitados. São três medições sequenciais por página/perfil (12 no total), com as configurações padrão mobile e `desktopConfig`. As suítes Playwright não executaram durante a auditoria.

Comando reproduzível: `npm ci`, `npx playwright install chromium` e `npm run audit:lighthouse`. A rodada usou o build recém-gerado com `npm run build` e `node scripts/lighthouse.mjs`. O [script versionado](../../../scripts/lighthouse.mjs) serve o build na porta 4173 e encerra o navegador/servidor ao terminar. Estes são resultados locais, sem medição da rede da Vercel. Ferramentas, CPU, memória, sistema, user agent e todas as execuções estão em [summary.json](./summary.json).

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | mobile | 81 | 100 | 100 | 100 | 3,854 s | 0,000000 | 327,5 ms |
| Início | desktop | 98 | 100 | 100 | 100 | 1,168 s | 0,000000 | 0,0 ms |
| Detalhe | mobile | 77 | 100 | 100 | 100 | 3,881 s | 0,000000 | 443,0 ms |
| Detalhe | desktop | 98 | 100 | 100 | 100 | 1,139 s | 0,000000 | 6,0 ms |

As medianas são calculadas independentemente por categoria/métrica. Metas: Performance ≥90, Accessibility ≥95, Best Practices ≥95 e SEO ≥90. Desktop atingiu todas; Performance mobile permanece abaixo de 90. As outras categorias atingiram 100 em todas as combinações.

## Resultado da separação dos filtros

HeaderSearch e o formulário de busca passaram a módulos leves. O painel carrega seus filtros ao abrir; a sidebar só monta a partir de 1024 px e a ordenação do toolbar, a partir de 768 px. `matchMedia` acompanha redimensionamentos e a URL conserva os filtros aplicados. Componentes shadcn/ui e classes visuais foram preservados.

| Página | Scripts iniciais | JavaScript antes/depois, sem compressão | Redução |
| --- | ---: | ---: | ---: |
| Início mobile | 28 → 25 | 1.214,9 → 1.112,1 kB | 102,8 kB (8,5%) |
| Detalhe mobile | 32 → 31 | 1.235,5 → 1.168,5 kB | 67,0 kB (5,4%) |

Os números usam os recursos Script da segunda execução mobile em cada rodada, com o painel fechado. São bytes de código recebido/descomprimido, e não estimativa de banda economizada. A carga de Select/filtros desapareceu dessas aberturas; o teste de regressão também verifica que os módulos chegam ao abrir o painel e que o estado aplicado sobrevive a 390/1440/768 px.

**Não houve ganho demonstrado na pontuação.** A mediana mobile do início permaneceu em 81; a do detalhe variou de 79 para 77. O LCP caiu de 3,966/3,991 s para 3,854/3,881 s, enquanto TBT subiu de 289,5/374,5 ms para 327,5/443 ms. São rodadas separadas, sujeitas às condições de execução; a comparação comprova a redução de arquivos/bytes, sem estabelecer a causa da variação de TBT. Desktop conservou Performance 98.

O [resumo anterior](./before-catalog-loading.json) e a [comparação dos recursos](./catalog-loading-comparison.json) estão preservados. Os HTML/JSON anteriores completos estão no [commit 7924356](https://github.com/luanlumertz/nft-marketplace/tree/7924356/reports/lighthouse/final).

## Limitação de performance mobile

LCP próximo de quatro segundos, tarefas longas e trabalho de JavaScript no bootstrap continuam limitando a nota. O pacote de mocks permanece no carregamento inicial. A simulação precisa instalar os interceptors antes da importação do cliente Socket.IO; depois são carregados roteador, renderização e consultas. Os relatórios apontam esse encadeamento e trabalho de scripts, sem atribuir todo o custo a uma biblioteca isolada.

As três execuções do início mobile tiveram 65 (TBT 1.100,9 ms), 81 (TBT 327,0 ms), 81 (TBT 327,5 ms). Todas estão preservadas e entram no cálculo, incluindo a primeira mais lenta. A nota varia com máquina, carga e throttling; a avaliação deve repetir o comando nas mesmas condições.

Os ajustes anteriores de skeleton/CLS, fontes, carregamento dos primeiros cards, semântica e área de toque permanecem. Preloads adicionais de imagens/módulos já foram testados e retirados por piorarem o LCP. As funcionalidades, fontes e imagens não foram removidas para elevar a nota. A antecipação das consultas foi posteriormente [testada e retirada por não demonstrar benefício](../../validation/route-prefetch.md). A divisão dos mocks não foi implementada.

## Relatórios completos

- home/mobile/1: [HTML](./home-mobile-1.html) · [JSON](./home-mobile-1.json)
- home/mobile/2: [HTML](./home-mobile-2.html) · [JSON](./home-mobile-2.json)
- home/mobile/3: [HTML](./home-mobile-3.html) · [JSON](./home-mobile-3.json)
- home/desktop/1: [HTML](./home-desktop-1.html) · [JSON](./home-desktop-1.json)
- home/desktop/2: [HTML](./home-desktop-2.html) · [JSON](./home-desktop-2.json)
- home/desktop/3: [HTML](./home-desktop-3.html) · [JSON](./home-desktop-3.json)
- detail/mobile/1: [HTML](./detail-mobile-1.html) · [JSON](./detail-mobile-1.json)
- detail/mobile/2: [HTML](./detail-mobile-2.html) · [JSON](./detail-mobile-2.json)
- detail/mobile/3: [HTML](./detail-mobile-3.html) · [JSON](./detail-mobile-3.json)
- detail/desktop/1: [HTML](./detail-desktop-1.html) · [JSON](./detail-desktop-1.json)
- detail/desktop/2: [HTML](./detail-desktop-2.html) · [JSON](./detail-desktop-2.json)
- detail/desktop/3: [HTML](./detail-desktop-3.html) · [JSON](./detail-desktop-3.json)
