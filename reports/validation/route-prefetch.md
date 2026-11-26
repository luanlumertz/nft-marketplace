# Experimento de antecipação das consultas

Em 26/11/2026, foi avaliado o início das consultas públicas pelo TanStack Router, antes da carga dos componentes de catálogo e detalhe. O controle foi o código funcional `e0805fe` (HEAD documental `0042c59`). O critério era manter a alteração somente com benefício demonstrado.

A variante adicionou um `loader` não bloqueante em cada rota, chamando `context.queryClient.prefetchQuery` com as opções existentes (`nftListOptions` e `nftDetailOptions`). No catálogo, `loaderDeps` recebia o mesmo search validado da URL. Chaves de cache, staleTime, Axios, mocks e componentes permaneceram iguais.

O build da variante passou. Quatro casos Playwright passaram em Chromium desktop/mobile no Windows, sem retries: o teste segurava o módulo JavaScript do componente e aguardava a resposta REST/MSW antes de liberá-lo. Confirmou consulta antecipada, uma resposta por rota antes da liberação, parâmetros de filtro e renderização posterior. Esses casos eram específicos do experimento e foram retirados junto com os loaders.

## Comparação mobile

Foram feitas três medições Lighthouse por página e por variante, sequenciais, com o build otimizado e sem testes concorrentes. Primeiro foi medida a variante; depois, o controle reconstruído. Todas as execuções, inclusive as primeiras mais lentas, entraram nas medianas. Os [resumos completos](./route-prefetch-comparison.json) registram ambiente, horários e resultados individuais.

| Página | Variante | Performance | LCP | TBT |
| --- | --- | ---: | ---: | ---: |
| Início | Controle | 80 | 3,861 s | 353 ms |
| Início | Consultas antecipadas | 74 | 4,064 s | 519 ms |
| Detalhe | Controle | 77 | 3,873 s | 454 ms |
| Detalhe | Consultas antecipadas | 72 | 4,010 s | 623 ms |

Accessibility, Best Practices e SEO ficaram em 100, com CLS zero, nas duas variantes. Esta é uma comparação local em sequência, sujeita à variação de carga e execução; ela não prova que os loaders causaram toda a diferença de pontuação.

**A antecipação funcionou tecnicamente, mas não demonstrou benefício de performance. A alteração foi retirada.** O aplicativo conserva integralmente o código anterior ao experimento, incluindo layout e estados de carregamento/erro. Os relatórios oficiais de entrega em `reports/lighthouse/final/` continuam associados ao código funcional `e0805fe`; esta rodada mobile não os substitui. Não foi executada novamente a suíte completa após restaurar o código, pois nenhuma alteração de aplicação permaneceu.

Reprodução da medição, após gerar o build de cada variante:

```sh
npm run build
node scripts/lighthouse.mjs --profile=mobile
```
