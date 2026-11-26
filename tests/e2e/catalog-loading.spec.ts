import { test, expect } from '@playwright/test'

test('carrega filtros quando usados e preserva o estado ao redimensionar', async ({
  page,
}) => {
  const scripts: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'script')
      scripts.push(new URL(request.url()).pathname)
  })
  const filterCodeLoaded = () =>
    scripts.some((path) =>
      /\/(?:catalog-filters|catalog-filter-dialog|select)-/.test(path),
    )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/nfts/emerald-ape-042')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042', exact: true }),
  ).toBeVisible()
  expect(filterCodeLoaded()).toBe(false)

  await page.goto('/?networks=polygon&sort=price-desc')
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()
  expect(filterCodeLoaded()).toBe(false)
  const trigger = page
    .getByRole('button', { name: 'Abrir filtros' })
    .filter({ visible: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Filtrar NFTs' })
  await expect(dialog.getByRole('checkbox', { name: /Polygon/ })).toBeChecked()
  await expect(
    dialog.getByRole('combobox', { name: 'Ordenar por', exact: true }),
  ).toContainText('Maior preço')
  expect(filterCodeLoaded()).toBe(true)
  await dialog.getByLabel('De', { exact: true }).fill('1')
  await dialog.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await dialog
    .getByRole('button', { name: 'Ver resultados', exact: true })
    .click()
  await expect(trigger).toBeFocused()

  await page.setViewportSize({ width: 1440, height: 1000 })
  const sidebar = page.getByRole('complementary', {
    name: 'Filtros do catálogo',
  })
  await expect(sidebar).toBeVisible()
  await expect(sidebar.getByRole('checkbox', { name: /Polygon/ })).toBeChecked()
  await expect(sidebar.getByLabel('De', { exact: true })).toHaveValue('1')
  await expect(
    page.getByRole('combobox', { name: 'Ordenar NFTs', exact: true }),
  ).toContainText('Maior preço')

  await page.setViewportSize({ width: 768, height: 1000 })
  await expect(sidebar).toBeHidden()
  await trigger.click()
  await expect(dialog.getByRole('checkbox', { name: /Polygon/ })).toBeChecked()
  await expect(dialog.getByLabel('De', { exact: true })).toHaveValue('1')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  expect(
    JSON.parse(new URL(page.url()).searchParams.get('networks') ?? '[]'),
  ).toEqual(['polygon'])
  expect(new URL(page.url()).searchParams.get('sort')).toBe('price-desc')
  expect(
    JSON.parse(new URL(page.url()).searchParams.get('minPrice') ?? 'null'),
  ).toBe('1')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
