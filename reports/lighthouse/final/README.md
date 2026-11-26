# Lighthouse — fechamento da entrega

Auditoria de 26/11/2026, código funcional `a1a6d95`, baseado no merge `ead1e9c`. Build otimizado, cenário padrão MSW, imagens e fontes reais locais, REST e Socket.IO habilitados. São três medições sequenciais por página/perfil, total de 12, com a configuração padrão mobile e `desktopConfig` do Lighthouse. As suítes Playwright não executaram durante esta auditoria.

Comando reproduzível: `npm ci`, `npx playwright install chromium` e `npm run audit:lighthouse`. O script versionado em [scripts/lighthouse.mjs](../../../scripts/lighthouse.mjs) inicia seu preview na porta 4173 e encerra o navegador/servidor ao concluir. Estes são resultados locais do build; não são uma medição da rede da Vercel. Ferramentas, CPU, memória, sistema, user agent, medições individuais e medianas estão em [summary.json](./summary.json).

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | mobile | 81 | 100 | 100 | 100 | 3,966 s | 0,000000 | 289,5 ms |
| Início | desktop | 98 | 100 | 100 | 100 | 1,092 s | 0,000003 | 0,0 ms |
| Detalhe | mobile | 79 | 100 | 100 | 100 | 3,991 s | 0,000000 | 374,5 ms |
| Detalhe | desktop | 98 | 100 | 100 | 100 | 1,141 s | 0,000000 | 0,0 ms |

As colunas são medianas independentes de cada categoria/métrica. Metas do desafio: Performance ≥90, Accessibility ≥95, Best Practices ≥95 e SEO ≥90. Todas foram atingidas no desktop; no mobile, Performance permanece abaixo de 90 nas duas páginas. As outras três categorias atingiram 100 em todas as combinações.

## Limitação de performance mobile

LCP próximo de quatro segundos e TBT entre 290 e 375 ms nas medianas limitam a nota mobile. Os relatórios apontam trabalho de inicialização/avaliação de JavaScript, tarefas longas e descoberta tardia do conteúdo após o bootstrap. O MSW precisa instalar os interceptors antes da importação do cliente Socket.IO; depois vêm roteador, renderização, validação dos contratos e consultas. Esse encadeamento e o custo do código da simulação participam do caminho crítico. Não se atribui todo o atraso a uma biblioteca isolada.

No início mobile, as três execuções tiveram Performance 65 (TBT 1.053,6 ms), 82 (TBT 269,5 ms), 81 (TBT 289,5 ms). A primeira medição mais lenta está preservada e entra no cálculo; nenhuma execução foi descartada. Pontuações de laboratório variam com máquina, carga e configuração de throttling; a avaliação deve repetir o comando nas mesmas condições.

## Ajustes aplicados

- Reserva da altura do detalhe durante o skeleton, reduzindo o CLS desktop observado no diagnóstico inicial (~0,19) para mediana zero no detalhe completo.
- Preload dos quatro pesos de fonte utilizados e carregamento imediato dos quatro primeiros cards; as demais artes continuam com lazy loading.
- Correção semântica dos ícones sociais indisponíveis e área de toque de 24 px nos controles de compartilhar. Accessibility passou a 100 nas páginas auditadas; isso não substitui os testes manuais de teclado e foco.

Também foram experimentados preloads adicionais de imagens e dos módulos da aplicação. Houve competição de banda e piora do LCP, por isso não fazem parte do código entregue. A fonte, os assets e os fluxos não foram removidos ou substituídos para elevar a nota. A oportunidade restante é reduzir/dividir o trabalho inicial dos mocks e do runtime, revalidando os cenários completos e a ordem de ativação dos interceptors.

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
