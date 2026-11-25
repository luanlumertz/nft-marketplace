import { test, expect, type Page } from '@playwright/test'
import { mockRequest } from './helpers'

const items = (page: Page) =>
  page.getByRole('list', { name: 'NFTs no carrinho' })
const row = (page: Page, name = 'Emerald Ape #042') =>
  items(page).getByRole('listitem').filter({ hasText: name })
const visibleButton = (page: Page, name: string | RegExp) =>
  page
    .getByRole('button', { name, exact: typeof name === 'string' })
    .filter({ visible: true })
async function addFromDetail(page: Page, quantity = 1, edition?: string) {
  await page.goto('/nfts/emerald-ape-042')
  if (edition) await visibleButton(page, edition).click()
  for (let index = 1; index < quantity; index++)
    await visibleButton(page, 'Aumentar quantidade').click()
  await visibleButton(page, /^(COMPRAR|Comprar NFT)$/).click()
  await expect(page).toHaveURL('/carrinho')
  await expect(items(page).getByRole('listitem').first()).toBeVisible()
}
async function signIn(page: Page, email = 'ana@kurio.demo') {
  const form = page.getByRole('form', { name: 'Entrar na Kurio' })
  await form.getByLabel('E-mail', { exact: true }).fill(email)
  await form.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/carrinho')
}
async function seedCart(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()
  await page.evaluate(async () => {
    const selections = [
      { nftId: 'emerald-ape-042', editionId: 'fifty', quantity: 1 },
      { nftId: 'violet-nomad-314', editionId: 'fifty', quantity: 1 },
      { nftId: 'ivory-baron-088', editionId: 'ten', quantity: 2 },
      { nftId: 'golden-beat-207', editionId: 'fifty', quantity: 2 },
    ]
    for (const selection of selections) {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cart-Guest': localStorage.getItem('kurio:cart-guest')!,
        },
        body: JSON.stringify(selection),
      })
      if (!response.ok)
        throw new Error(
          `Não foi possível preparar o carrinho: ${response.status}`,
        )
    }
  })
  await page.goto('/carrinho')
  await expect(items(page).getByRole('listitem')).toHaveCount(4)
}

test('adiciona a seleção do detalhe, altera quantidade, persiste e remove o item', async ({
  page,
}) => {
  await addFromDetail(page, 2)
  const quantity = row(page).getByRole('status', {
    name: /Quantidade de Emerald/,
  })
  await expect(quantity).toHaveText('2')
  await expect(page.getByText('2.396 ETH', { exact: true })).toBeVisible()
  await row(page)
    .getByRole('button', { name: /Aumentar quantidade/ })
    .click()
  await expect(quantity).toHaveText('3')
  await expect(page.getByText('3.586 ETH', { exact: true })).toBeVisible()
  await page.reload()
  await expect(quantity).toHaveText('3')
  await row(page)
    .getByRole('button', { name: /Diminuir quantidade/ })
    .click()
  await expect(quantity).toHaveText('2')
  await row(page)
    .getByRole('button', { name: /^Remover / })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
})

test('separa edições do mesmo NFT e recusa adicionar acima do estoque', async ({
  page,
}) => {
  await addFromDetail(page, 2)
  await addFromDetail(page, 1, '1/10')
  await expect(items(page).getByRole('listitem')).toHaveCount(2)
  await expect(page.getByText('4.776 ETH', { exact: true })).toBeVisible()
  const fifty = row(page).filter({
    has: page.getByRole('status', {
      name: 'Quantidade de Emerald Ape #042, edição 1/50',
    }),
  })
  await fifty.getByRole('button', { name: /Aumentar quantidade/ }).click()
  await expect(fifty.getByRole('status')).toHaveText('3')
  await fifty.getByRole('button', { name: /Aumentar quantidade/ }).click()
  await expect(fifty.getByRole('status')).toHaveText('4')
  await expect(
    fifty.getByRole('button', { name: /Aumentar quantidade/ }),
  ).toBeDisabled()
  await page.goto('/nfts/emerald-ape-042')
  await visibleButton(page, /^(COMPRAR|Comprar NFT)$/).click()
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText(
    'Disponibilidade alterada',
  )
  await page.goto('/carrinho')
  await expect(fifty.getByRole('status')).toHaveText('4')
  await fifty.getByRole('button', { name: /^Remover / }).click()
  await expect(items(page).getByRole('listitem')).toHaveCount(1)
  await expect(row(page).getByRole('status')).toHaveText('1')
})

test('valida cupom inválido e expirado, aplica desconto pela API e permite remover', async ({
  page,
}) => {
  await addFromDetail(page, 2)
  const form = page.getByRole('form', { name: 'Código promocional' })
  const code = form.getByLabel('Código promocional', { exact: true })
  for (const [value, message] of [
    ['INVALIDO', 'inválido'],
    ['EXPIRADO', 'expirou'],
  ]) {
    await code.fill(value)
    await form.getByRole('button', { name: 'Aplicar', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(message)
    await expect(page.getByText('2.396 ETH', { exact: true })).toBeVisible()
  }
  await code.fill('kurio10')
  await form.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByText('2.158 ETH', { exact: true })).toBeVisible()
  await expect(page.getByText('(-) 0.238 ETH', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('2.158 ETH', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Remover cupom', exact: true }).click()
  await expect(page.getByText('2.396 ETH', { exact: true })).toBeVisible()
})

test('preserva o carrinho do visitante no login e isola contas e logout', async ({
  page,
}) => {
  await addFromDetail(page, 2)
  await page
    .getByRole('link', { name: 'Conectar e finalizar', exact: true })
    .click()
  await signIn(page)
  await expect(row(page).getByRole('status')).toHaveText('2')
  await page.reload()
  await expect(row(page).getByRole('status')).toHaveText('2')
  await page.goto('/')
  await visibleButton(page, 'Abrir conta de Ana Costa').click()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/carrinho')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
  await page.goto('/login?redirect=%2Fcarrinho')
  await signIn(page, 'bruno@kurio.demo')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
  await page.goto('/')
  await visibleButton(page, 'Abrir conta de Bruno Lima').click()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/login?redirect=%2Fcarrinho')
  await signIn(page)
  await expect(row(page).getByRole('status')).toHaveText('2')
})

test('reconcilia preço e disponibilidade via Socket.IO sem perder precisão ou regredir eventos', async ({
  page,
}) => {
  await addFromDetail(page, 2)
  const event = await mockRequest(page, 'nfts/emerald-ape-042', {
    priceEth: '2.123456789123456789',
    available: 1,
  })
  await expect(
    page.getByText('4.262913578246913578 ETH', { exact: true }),
  ).toBeVisible()
  await expect(row(page)).toContainText('Restam 1 unidades')
  await mockRequest(page, 'events', event)
  await mockRequest(page, 'events', {
    ...event,
    version: 1,
    data: { ...event.data, version: 1, priceEth: '0.01', available: 99 },
  })
  await expect(
    page.getByText('4.262913578246913578 ETH', { exact: true }),
  ).toBeVisible()
  await row(page).getByRole('button', { name: 'Ajustar quantidade' }).click()
  await expect(
    page.getByText('2.139456789123456789 ETH', { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByText('2.139456789123456789 ETH', { exact: true }),
  ).toBeVisible()
  await mockRequest(page, 'nfts/emerald-ape-042', { available: 0 })
  await expect(row(page)).toContainText('Esta edição está esgotada')
  await expect(
    page.getByRole('link', { name: 'Conectar e finalizar', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('exibe skeletons e recupera falha de consulta e de alteração sem perder itens', async ({
  page,
}) => {
  await addFromDetail(page)
  await mockRequest(page, 'scenario', 'slow')
  await page.reload()
  await expect(
    page.getByRole('status', { name: 'Carregando resumo do carrinho' }),
  ).toBeVisible()
  await expect(row(page)).toBeVisible()
  await mockRequest(page, 'scenario', 'cart-error')
  await row(page)
    .getByRole('button', { name: /Aumentar quantidade/ })
    .click()
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível atualizar o carrinho',
  )
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar o carrinho',
  )
  await mockRequest(page, 'scenario', 'default')
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click()
  await expect(row(page).getByRole('status')).toHaveText('1')
})

test('mantém a composição visual do carrinho e não cria overflow', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedCart(page)
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = [...document.images].filter(
      (image) => image.getClientRects().length,
    )
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode()))
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await expect(page).toHaveScreenshot('carrinho.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixels: 3000,
  })
})
