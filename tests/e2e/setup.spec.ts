import { test, expect } from '@playwright/test'
import { nftUpdatedSchema } from '../../src/features/nfts/contracts'
import { mockRequest } from './helpers'

test('abre a coleção, navega para o NFT e preserva o acesso após refresh', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Seja dono/ })).toBeVisible()
  const collection = page.getByRole('list', { name: 'NFTs da coleção' })
  await expect(collection.getByRole('listitem')).toHaveCount(9)
  await collection.getByRole('link', { name: /Emerald Ape/ }).click()
  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042$/)
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
  await expect(page.getByText('1.19 ETH', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('trata NFT inexistente e rota desconhecida', async ({ page }) => {
  await page.goto('/nfts/inexistente')
  await expect(
    page.getByRole('heading', { name: 'NFT não encontrado' }),
  ).toBeVisible()
  await page.goto('/endereco-inexistente')
  await expect(
    page.getByRole('heading', { name: 'Página não encontrada' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()
})

test('mostra skeleton, falha recuperável e resultado vazio com cenários MSW', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()
  await mockRequest(page, 'scenario', 'slow')
  await page.reload()
  await expect(
    page.getByRole('status', { name: 'Carregando NFTs' }),
  ).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()

  await mockRequest(page, 'scenario', 'catalog-error')
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar os NFTs.',
  )
  await mockRequest(page, 'scenario', 'default')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()

  await mockRequest(page, 'scenario', 'empty')
  await page.reload()
  await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
})

test('atualiza pelo Socket.IO, ignora evento antigo e mantém a mudança após refresh', async ({
  page,
}) => {
  await page.goto('/nfts/emerald-ape-042')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch('/api/__mock/state')
        const data = (await response.json()) as { subscribers: number }
        return data.subscribers
      }),
    )
    .toBe(1)

  const event = nftUpdatedSchema.parse(
    await mockRequest(page, 'nfts/emerald-ape-042', {
      priceEth: '2.123456789123456789',
      available: 0,
    }),
  )
  await expect(
    page.getByText('2.123456789123456789 ETH', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Edição esgotada', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    'Preço ou disponibilidade',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await mockRequest(page, 'events', event)
  await mockRequest(page, 'events', {
    ...event,
    version: 1,
    data: { ...event.data, version: 1, priceEth: '0.01', available: 99 },
  })
  await expect(
    page.getByText('2.123456789123456789 ETH', { exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Voltar à coleção' }).click()
  const nft = page.getByRole('listitem').filter({ hasText: 'Emerald Ape #042' })
  await expect(nft).toContainText('2.123456789123456789 ETH')
  await page.reload()
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Emerald Ape #042' }),
  ).toContainText('2.123456789123456789 ETH')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('permite pular ao conteúdo com teclado e não cria overflow', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Pular para o conteúdo' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
})
