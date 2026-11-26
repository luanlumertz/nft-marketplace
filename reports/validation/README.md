# Conferência final — 26/11/2026

Código funcional `a1a6d95`, baseado no merge `ead1e9c`. Build otimizado com MSW, fontes/imagens locais e Socket.IO ativos.

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

Em Linux, instale o navegador com `npx playwright install --with-deps chromium`. `test:e2e` gera o build pelo `webServer` e executa os 96 testes. O relatório está em `playwright-report/`, com screenshots/traces de falhas em `test-results/`; a CI publica ambos como artefato. A auditoria inicia seu próprio preview e exige a porta 4173 livre; execute-a separadamente dos testes para evitar disputa de recursos.

Para atualizar uma baseline após mudança visual intencional, use `npm run test:e2e -- --grep composição --update-snapshots=all` no respectivo sistema e confira as imagens antes de versionar.

## Limitação registrada

Performance mobile ficou abaixo da meta de 90: mediana **81 no início e 79 no detalhe**. Desktop teve 98 nas duas páginas, e Accessibility/Best Practices/SEO tiveram 100 em todos os perfis. O relatório Lighthouse entrega as 12 execuções completas, métricas, ambiente e justificativas; a entrega não declara que atingiu a meta de performance mobile.
