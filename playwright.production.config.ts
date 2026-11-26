import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// The same isolated MSW scenarios run against the deployed frontend.
export default defineConfig({
  ...base,
  webServer: undefined,
  retries: 0,
  grep: /combina filtros|abre a coleção|retoma o favorito|valida cadastro|valida perfil, trata conflito|cadastra, espelha|valida cupom inválido|compra do detalhe ao recibo|Socket.IO atualiza a revisão|recupera pedido pendente após reconectar/,
  outputDir: './artifacts/production-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './artifacts/production-report' }],
    ['json', { outputFile: './artifacts/production-results.json' }],
  ],
  use: {
    ...base.use,
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ??
      'https://nft-marketplace-chi-five.vercel.app',
  },
})
