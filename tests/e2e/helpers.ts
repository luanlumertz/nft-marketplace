import type { Page } from '@playwright/test'

export async function returnToCatalog(page: Page) {
  await page
    .getByRole('link', { name: 'Voltar à coleção', exact: true })
    .or(
      page
        .getByRole('navigation', { name: 'Caminho de navegação' })
        .getByRole('link', { name: 'Mercado', exact: true }),
    )
    .filter({ visible: true })
    .click()
}

export async function mockRequest(page: Page, path: string, body: unknown) {
  return page.evaluate(
    async ({ path, body }) => {
      const response = await fetch(`/api/__mock/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok)
        throw new Error(`Controle MSW falhou: ${response.status}`)
      return response.status === 204 ? null : response.json()
    },
    { path, body },
  )
}
