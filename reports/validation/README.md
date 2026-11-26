# Conferência final — 26/11/2026

Registro inicial do código funcional `a1a6d95`, baseado no merge `ead1e9c`. A revisão de carregamento `e0805fe` está descrita abaixo. Build otimizado com MSW, fontes/imagens locais e Socket.IO ativos.

| Verificação | Resultado |
| --- | --- |
| TypeScript, ESLint e build | Passaram |
| Suíte completa Chromium desktop/mobile, Ubuntu/WSL | 96/96, sem retries |
| Regressão visual, galeria, teclado, carregamento e recuperação, Windows | 16/16, sem retries |
| Fluxos principais na Vercel, desktop/mobile | 20/20, sem retries |
| Lighthouse, início/detalhe e desktop/mobile | 12 medições; [resultados e limitações](../lighthouse/final/README.md) |

O Linux executou todos os testes sobre o mesmo `dist/` otimizado, servido localmente. As oito novas baselines de detalhe/avaliações foram capturadas em Windows e Ubuntu/WSL, nos dois viewports. Início, carrinho e pagamento conservaram suas baselines existentes. Fontes e imagens são aguardadas antes das capturas.

Pagamento e recibo também foram conferidos em 390, 768 e 1440 px; detalhe e avaliações, em 320 e 768 px, sem overflow horizontal. A conferência anterior do catálogo cobre 320, 390, 768 e 1440 px. O mínimo suportado é 320 pixels CSS.

## Aplicação publicada

Os 20 testes em [nft-marketplace-chi-five.vercel.app](https://nft-marketplace-chi-five.vercel.app/) exercitaram filtros/histórico, detalhe/refresh, cadastro, perfil, carteiras, favoritos, cupom, compra até recibo, estoque alterado via Socket.IO e pedido pendente após reconexão. Cada teste usou um contexto novo e os mocks do próprio navegador, sem dados compartilhados entre usuários/dispositivos.

[production.json](./production.json) registra URL, horário, script servido, cenários e resultados. Essa conferência usa a `main` publicada antes deste PR final. Os ajustes finais de acessibilidade/carregamento serão publicados ao mesclar a branch; o comando abaixo permite repetir a verificação após o deploy, ou apontar para um preview por `PLAYWRIGHT_BASE_URL`.

```sh
npm run test:e2e:production
```

O relatório completo fica em `artifacts/production-report/`. A configuração versionada está em [playwright.production.config.ts](../../playwright.production.config.ts).

## Reproduzir localmente e consultar evidências

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm run lint
npm run test:e2e
npm run audit:lighthouse
```

Em Linux, instale o navegador com `npx playwright install --with-deps chromium`. `test:e2e` gera o build pelo `webServer` e executa os 98 testes atuais. O relatório está em `playwright-report/`, com screenshots/traces de falhas em `test-results/`; a CI publica ambos como artefato. A auditoria inicia seu próprio preview e exige a porta 4173 livre; execute-a separadamente dos testes para evitar disputa de recursos.

Para atualizar uma baseline após mudança visual intencional, use `npm run test:e2e -- --grep composição --update-snapshots=all` no respectivo sistema e confira as imagens antes de versionar.

## Limitação registrada

Performance mobile ficou abaixo da meta de 90: mediana **81 no início e 77 no detalhe** na rodada atual (antes da separação dos filtros: 81/79). Desktop teve 98 nas duas páginas, e Accessibility/Best Practices/SEO tiveram 100 em todos os perfis. O relatório Lighthouse entrega as 12 execuções completas, métricas, ambiente e justificativas; a entrega não declara que atingiu a meta de performance mobile.

## Revisão de carregamento dos filtros

Sobre o código `e0805fe`, passaram **32/32 testes no Windows e 32/32 no Ubuntu/WSL**, sem retries. Foram exercitados catálogo completo, busca/filtros, URL/histórico, sliders, erros, Socket.IO, foco, galeria, compra até o recibo e todas as baselines. O novo caso verifica carregamento sob demanda e preservação do estado entre 390, 1440 e 768 px. As imagens de referência não foram alteradas.

A suíte completa passa a ter **98 casos**. Esta revisão rodou os 32 casos afetados por sistema; os resultados de 96 completos e 20 públicos da tabela inicial se referem à versão anterior identificada no começo deste documento. Tipos, lint e build passaram na revisão.

Uma nova rodada de 12 medições Lighthouse foi executada separadamente dos testes. O JavaScript inicial diminuiu, mas a pontuação mobile não melhorou: 81/77 contra 81/79 anteriormente. A comparação de recursos, as medianas, os dados anteriores e os relatórios atuais estão em [Lighthouse final](../lighthouse/final/README.md).

## Experimento posterior de consultas antecipadas

O prefetch pelo Router foi implementado e conferido com quatro casos específicos em desktop/mobile no Windows, sem retries. A comparação mobile usou três medições por página em cada variante: início 74 contra 80 no controle; detalhe 72 contra 77. Como não demonstrou benefício, loaders e testes experimentais foram retirados. Nenhuma alteração de aplicação permaneceu. O [registro do experimento](./route-prefetch.md) conserva método, limites e resultados sem substituir a auditoria oficial acima.

## Revisão final de organização e formatação

Revisão do código funcional `df2a099`, após a formatação `4bbb71f`, em 26/11/2026. Foram inspecionados componentes, hooks, rotas, contratos, consultas/mutations, persistência, handlers/fixtures MSW, eventos, testes, scripts e configurações autorais. Arquivos gerados, assets, baselines e relatórios históricos não foram reformatados.

As mudanças se limitaram a extrações de componentes existentes (galeria, avaliações, recomendações e formulário de carteira), um grupo compartilhado para coleções/redes, título das páginas, leitura dos preços na URL, proteção de favoritos e leitura de JSON dos mocks. Campos e controles que já eram compartilhados foram mantidos; diferenças de markup, validação e estados entre telas não foram forçadas em uma abstração genérica. JSX, CSS e configuração comprimidos foram formatados. A [arquitetura](../../ARCHITECTURE.md) descreve os limites e motivos dessas escolhas.

| Verificação desta revisão | Resultado |
| --- | --- |
| TypeScript, ESLint e build otimizado | Passaram |
| Suíte completa Chromium desktop/mobile, Ubuntu/WSL | 98/98, sem retries, 7,5 minutos |
| Baselines, galeria, foco, precisão da URL, favoritos e filtros sob demanda, Windows | 18/18, sem retries |
| Imagens de referência e cenários de teste | Preservados, sem atualização de snapshots |

Os dois sistemas usaram o mesmo build otimizado. No Linux, um servidor estático na porta 4174 serviu o `dist/`; no Windows, `vite preview` usou a porta 4173. As configurações locais apenas reaproveitam o build e a configuração Playwright versionada, com um worker e retries zero. Os relatórios HTML locais ficam em `artifacts/linux-report/` e `playwright-report/`. A CI repete a suíte completa pelo comando público `npm run test:e2e`.

Não houve nova auditoria Lighthouse nem conferência de produção nesta etapa de organização. As pontuações 81/77 mobile e 98/98 desktop continuam identificadas como resultados da auditoria anterior em `e0805fe`; não são medições novas da refatoração. A verificação pública de 20 casos continua vinculada à `main` `ead1e9c`, anterior ao merge deste PR.
