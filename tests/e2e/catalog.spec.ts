import { test, expect, type Page } from '@playwright/test'
import { mockRequest, returnToCatalog } from './helpers'

const list = (page: Page) => page.getByRole('list', { name: 'NFTs da coleção' })
const mobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

async function openFilters(page: Page) {
  if (mobile(page)) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    return page.getByRole('dialog', { name: 'Filtrar NFTs' })
  }
  return page.getByRole('complementary', { name: 'Filtros do catálogo' })
}
async function closeFilters(page: Page) {
  if (mobile(page))
    await page.getByRole('button', { name: 'Ver resultados' }).click()
}
async function search(page: Page, value: string) {
  if (!mobile(page))
    await page.getByRole('button', { name: 'Abrir busca' }).click()
  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill(value)
  await page.getByRole('searchbox', { name: 'Buscar NFTs' }).press('Enter')
}

test('combina filtros, preço, busca e ordenação e restaura pelo histórico e refresh', async ({
  page,
}) => {
  await page.goto('/?page=2')
  await expect(
    page.getByRole('button', { name: 'Página 2', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  const filters = await openFilters(page)
  await filters.getByRole('checkbox', { name: /Arte digital/ }).check()
  await filters.getByRole('checkbox', { name: /Ethereum/ }).check()
  await filters.getByLabel('De', { exact: true }).fill('1.2')
  await filters.getByLabel('Até', { exact: true }).fill('1.8')
  const api = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname === '/api/nfts' &&
      url.searchParams.get('minPrice') === '1.2' &&
      url.searchParams.get('maxPrice') === '1.8'
    )
  })
  await filters.getByRole('button', { name: 'Aplicar', exact: true }).click()
  const request = new URL((await api).url())
  expect(request.searchParams.get('collections')).toBe('arte-digital')
  expect(request.searchParams.get('networks')).toBe('ethereum')
  expect(request.searchParams.get('page')).toBe('1')
  await closeFilters(page)
  await expect(list(page).getByRole('listitem')).toHaveCount(2)
  await expect(list(page)).toContainText('Cosmic Bloom #118')
  await expect(list(page)).toContainText('Ivory Baron #088')

  if (mobile(page)) {
    const dialog = await openFilters(page)
    await dialog
      .getByLabel('Ordenar por', { exact: true })
      .selectOption('price-desc')
    await closeFilters(page)
  } else
    await page
      .getByRole('combobox', { name: 'Ordenar NFTs' })
      .selectOption('price-desc')
  await expect(list(page).getByRole('listitem').first()).toContainText(
    'Ivory Baron',
  )
  await search(page, 'baron')
  await expect(list(page).getByRole('listitem')).toHaveCount(1)
  await expect(list(page)).toContainText('Ivory Baron')
  await page.goBack()
  await expect(list(page).getByRole('listitem')).toHaveCount(2)
  await page.goBack()
  await expect(list(page).getByRole('listitem').first()).toContainText(
    'Cosmic Bloom',
  )
  await page.goForward()
  await expect(list(page).getByRole('listitem').first()).toContainText(
    'Ivory Baron',
  )
  await page.reload()
  await expect(list(page).getByRole('listitem').first()).toContainText(
    'Ivory Baron',
  )
  await expect(list(page).getByRole('listitem')).toHaveCount(2)
  await list(page)
    .getByRole('link', { name: /Ivory Baron/ })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Ivory Baron #088' }),
  ).toBeVisible()
  await returnToCatalog(page)
  await expect(list(page).getByRole('listitem')).toHaveCount(2)
  await expect(page).toHaveURL(/sort=price-desc/)
})

test('pagina, normaliza parâmetros inválidos e não mantém a página ao trocar aba', async ({
  page,
}) => {
  await page.goto('/')
  await expect(list(page).getByRole('listitem')).toHaveCount(9)
  await page.getByRole('button', { name: 'Página 2', exact: true }).click()
  await expect(list(page).getByRole('listitem').first()).toContainText(
    'Emerald Ape #609',
  )
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Página 2', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await page.getByRole('tab', { name: 'Novos lançamentos' }).click()
  await expect(
    page.getByRole('tab', { name: 'Novos lançamentos' }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(
    page.getByRole('button', { name: 'Página 1', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await page.goto(
    '/?page=999&sort=invalido&minPrice=erro&collections=desconhecida',
  )
  await expect(
    page.getByRole('button', { name: 'Página 4', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page).toHaveURL(/page=4/)
  await expect(list(page).getByRole('listitem')).toHaveCount(9)
})

test('descarta uma resposta lenta após uma busca mais recente', async ({
  page,
}) => {
  await page.goto('/')
  await expect(list(page)).toBeVisible()
  await mockRequest(page, 'scenario', 'out-of-order')
  const earlier = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/nfts' &&
      new URL(request.url()).searchParams.get('q') === 'ape',
  )
  await search(page, 'ape')
  const firstRequest = await earlier
  const settled = firstRequest.response().catch(() => null)
  await search(page, 'golden')
  await expect(list(page).getByRole('listitem')).toHaveCount(9)
  await settled
  await expect(list(page)).not.toContainText('Emerald')
  await expect(list(page).getByRole('listitem').first()).toContainText('Golden')
  await expect(page).toHaveURL(/q=golden/)
})

test('recompõe filtros e ordem quando um preço muda pelo Socket.IO', async ({
  page,
}) => {
  await page.goto('/?networks=ethereum&maxPrice=1.5&sort=price-asc')
  await expect(list(page).getByRole('listitem')).toHaveCount(3)
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (await (await fetch('/api/__mock/state')).json()).subscribers,
      ),
    )
    .toBe(1)
  await mockRequest(page, 'nfts/emerald-ape-042', {
    priceEth: '2.5',
    available: 0,
  })
  await expect(list(page).getByRole('listitem')).toHaveCount(2)
  await expect(list(page)).not.toContainText('Emerald Ape')
  await page.goto('/nfts/emerald-ape-042')
  await expect(
    page.getByText('2.5 ETH', { exact: true }).filter({ visible: true }),
  ).toBeVisible()
  await expect(page.getByText('Edição esgotada', { exact: true })).toBeVisible()
})

test('preserva 18 casas decimais na faixa de preço e na API', async ({
  page,
}) => {
  await page.goto('/')
  await expect(list(page)).toBeVisible()
  await mockRequest(page, 'nfts/emerald-ape-042', {
    priceEth: '1.000000000000000001',
  })
  await page.goto(
    '/?minPrice=1.000000000000000001&maxPrice=1.000000000000000001',
  )
  await expect(list(page).getByRole('listitem')).toHaveCount(1)
  await expect(list(page)).toContainText('Emerald Ape')
  await expect(list(page)).toContainText('1.000000000000000001 ETH')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('trata busca vazia e falha de conexão com recuperação', async ({
  page,
}) => {
  await page.goto('/')
  await expect(list(page)).toBeVisible()
  await search(page, 'nft que nao existe')
  await expect(
    page.getByRole('heading', { name: 'Nenhum NFT encontrado.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros e explorar' }).click()
  await expect(list(page).getByRole('listitem')).toHaveCount(9)
  await mockRequest(page, 'scenario', 'network-error')
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar os NFTs.',
  )
  await mockRequest(page, 'scenario', 'default')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(list(page)).toBeVisible()
})

test('controla foco do painel de filtros ou do diálogo de busca', async ({
  page,
}) => {
  await page.goto('/')
  await expect(list(page)).toBeVisible()
  const trigger = page.getByRole('button', {
    name: mobile(page) ? 'Abrir filtros' : 'Abrir busca',
  })
  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true)
  await page.keyboard.press('Shift+Tab')
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('ajusta os dois preços na mesma barra e só mostra limpar com filtros ativos', async ({
  page,
}) => {
  await page.goto('/')
  await expect(list(page).getByRole('listitem')).toHaveCount(9)
  const filters = await openFilters(page)
  const clear = filters.getByRole('button', {
    name: 'Limpar filtros',
    exact: true,
  })
  await expect(clear).toHaveCount(0)
  const minimum = filters.getByRole('slider', { name: 'Ajustar preço mínimo' })
  const maximum = filters.getByRole('slider', { name: 'Ajustar preço máximo' })
  await minimum.scrollIntoViewIfNeeded()
  const track = await filters.locator('.price-track').boundingBox()
  if (!track) throw new Error('Barra de preço não encontrada')
  for (const [thumb, fraction] of [
    [minimum, 0.25],
    [maximum, 0.75],
  ] as const) {
    const box = await thumb.boundingBox()
    if (!box) throw new Error('Controle de preço não encontrado')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      track.x + track.width * fraction,
      track.y + track.height / 2,
    )
    await page.mouse.up()
  }
  const minInput = filters.getByLabel('De', { exact: true })
  const maxInput = filters.getByLabel('Até', { exact: true })
  const lower = Number(await minInput.inputValue())
  const upper = Number(await maxInput.inputValue())
  expect(lower).toBeGreaterThan(3)
  expect(lower).toBeLessThan(3.2)
  expect(upper).toBeGreaterThan(9.1)
  expect(upper).toBeLessThan(9.4)
  await minimum.focus()
  await page.keyboard.press('ArrowRight')
  await expect(minInput).toHaveValue((lower + 0.01).toFixed(2))
  await maximum.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(maxInput).toHaveValue((upper - 0.01).toFixed(2))
  await filters.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(clear).toBeVisible()
  await expect(page).toHaveURL(/minPrice=/)
  await clear.click()
  await expect(clear).toHaveCount(0)
  await expect(minInput).toHaveValue('0')
  await expect(maxInput).toHaveValue('12.3')
  await filters.getByRole('checkbox', { name: /Ethereum/ }).check()
  await expect(clear).toBeVisible()
  await filters.getByRole('checkbox', { name: /Ethereum/ }).uncheck()
  await expect(clear).toHaveCount(0)
})

test('alterna o destaque e mantém texto e imagem separados no mobile', async ({
  page,
}) => {
  await page.goto('/')
  const hero = page.getByRole('region', { name: 'Destaques da Kurio' })
  for (const index of [1, 2, 0]) {
    const dot = hero.getByRole('button', { name: `Destaque ${index + 1}` })
    await dot.click()
    await expect(dot).toHaveAttribute('aria-pressed', 'true')
    await expect(hero.locator('button[aria-pressed="true"]')).toHaveCount(1)
    await expect(hero.getByRole('img')).toHaveCount(1)
    if (mobile(page)) {
      for (const width of [320, 390, 414]) {
        await page.setViewportSize({ width, height: 844 })
        const copy = await hero.locator('.hero-copy').boundingBox()
        const image = await hero.getByRole('img').boundingBox()
        if (!copy || !image) throw new Error('Destaque não encontrado')
        expect(copy.x + copy.width).toBeLessThanOrEqual(image.x)
      }
    }
  }
})

test('mantém a composição visual do início', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(list(page).getByRole('listitem')).toHaveCount(9)
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-busy', 'false')
  expect(
    await page
      .getByRole('main')
      .evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain('Roboto Mono')
  await page.evaluate(async () => {
    await document.fonts.ready
    const visible = [...document.images].filter(
      (image) => image.getClientRects().length > 0,
    )
    for (const image of visible) image.loading = 'eager'
    await Promise.all(visible.map((image) => image.decode()))
  })
  expect(
    await page.evaluate(() => document.fonts.check('400 16px "Roboto Mono"')),
  ).toBe(true)
  await expect(page).toHaveScreenshot('inicio.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixels: 3000,
  })
})
