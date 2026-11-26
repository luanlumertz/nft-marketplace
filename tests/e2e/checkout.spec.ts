import { test, expect, type Page } from '@playwright/test'
import { chooseOption, mockRequest } from './helpers'

const visible = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).filter({ visible: true })
async function api(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
) {
  return page.evaluate(
    async ({ method, path, body, extraHeaders }) => {
      const response = await fetch(`/api${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kurio:session-token')}`,
          ...extraHeaders,
        },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      })
      return {
        status: response.status,
        data: response.status === 204 ? null : await response.json(),
      }
    },
    { method, path, body, extraHeaders },
  )
}
async function login(page: Page, email = 'ana@kurio.demo') {
  const form = page.getByRole('form', { name: 'Entrar na Kurio' })
  await form.getByLabel('E-mail', { exact: true }).fill(email)
  await form.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
}
async function prepare(page: Page) {
  await page.goto('/nfts/emerald-ape-042')
  await page
    .getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })
    .filter({ visible: true })
    .click()
  await expect(page).toHaveURL('/carrinho')
  await page
    .getByRole('link', { name: 'Conectar e finalizar', exact: true })
    .click()
  await login(page)
  await expect(page).toHaveURL('/carrinho')
  const wallet = {
    displayName: 'Ana Costa',
    walletAlias: 'Principal',
    network: 'ethereum',
    profileName: 'ana',
    address: '0x1111111111111111111111111111111111111111',
    secondaryAddress: '',
    provider: 'metamask',
    referralCode: 'KURIO',
    email: 'ana@kurio.demo',
    ensName: 'ana.eth',
    sameAsPrimary: false,
  }
  expect((await api(page, 'PUT', '/wallets/primary', wallet)).status).toBe(200)
  expect(
    (
      await api(page, 'PUT', '/wallets/secondary', {
        ...wallet,
        walletAlias: 'Reserva',
        network: 'polygon',
        address: '0x2222222222222222222222222222222222222222',
      })
    ).status,
  ).toBe(200)
  await page
    .getByRole('link', { name: 'Conectar e finalizar', exact: true })
    .click()
  await expect(page).toHaveURL('/pagamento')
  await expect(
    page.getByRole('form', { name: 'Pagamento', exact: true }),
  ).toBeVisible()
}
async function selectProvider(page: Page) {
  await page.getByRole('radio', { name: /MetaMask/ }).check()
}
async function review(page: Page) {
  await visible(page, 'Confirmar compra').click()
  const dialog = page.getByRole('dialog', { name: 'Revisar compra' })
  await expect(dialog).toBeVisible()
  return dialog
}
async function send(page: Page) {
  const dialog = await review(page)
  await dialog
    .getByRole('button', { name: 'Confirmar e enviar pedido' })
    .click()
  await expect(page).toHaveURL(/\/pedidos\/[a-f0-9-]+$/)
}
async function confirmed(page: Page) {
  await expect(
    page.getByRole('heading', {
      name: 'Seus NFTs agora estão na sua carteira',
    }),
  ).toBeVisible()
}
test('compra do detalhe ao recibo, preserva o snapshot e limpa somente a compra confirmada', async ({
  page,
}) => {
  await prepare(page)
  const availableBefore = (await api(page, 'GET', '/nfts/emerald-ape-042')).data
    .available
  await selectProvider(page)
  await send(page)
  await confirmed(page)
  const url = page.url()
  await expect(
    page.getByRole('list', { name: 'Itens do pedido' }),
  ).toContainText('Emerald Ape #042')
  await expect(
    page.getByRole('definition').filter({ hasText: '1.206 ETH' }),
  ).toHaveCount(2)
  expect((await api(page, 'GET', '/cart')).data.items).toHaveLength(0)
  expect((await api(page, 'GET', '/nfts/emerald-ape-042')).data.available).toBe(
    availableBefore - 1,
  )
  await mockRequest(page, 'nfts/emerald-ape-042', {
    priceEth: '9.99',
    available: 0,
  })
  await page.reload()
  await confirmed(page)
  await expect(
    page.getByRole('list', { name: 'Itens do pedido' }),
  ).toContainText('1.19 ETH')
  await visible(page, 'Ver no Etherscan').click()
  await expect(
    page.getByRole('region', { name: 'Explorador simulado' }),
  ).toContainText('sem consulta à blockchain')
  await expect(page).toHaveURL(url)
})
test('valida o coletor, conecta ao confirmar e alterna carteiras sem uma etapa extra', async ({
  page,
  isMobile,
}) => {
  await prepare(page)
  const form = page.getByRole('form', { name: 'Pagamento', exact: true })
  await expect(visible(page, 'Confirmar compra')).toBeDisabled()
  await selectProvider(page)
  if (!isMobile) {
    await form.getByLabel('Nome de exibição', { exact: false }).fill('')
    await visible(page, 'Confirmar compra').click()
    await expect(
      form.getByLabel('Nome de exibição', { exact: false }),
    ).toHaveAttribute('aria-invalid', 'true')
    await form
      .getByLabel('Nome de exibição', { exact: false })
      .fill('Ana Costa')
    await expect(
      form.getByLabel('Carteira cadastrada', { exact: true }),
    ).toHaveCount(0)
  }
  await mockRequest(page, 'scenario', 'wallet-rejected')
  await visible(page, 'Confirmar compra').click()
  await expect(form.getByRole('alert')).toContainText('conexão foi recusada')
  await mockRequest(page, 'scenario', 'default')
  if (isMobile) {
    await visible(page, 'Trocar carteira').click()
    await expect(form.getByRole('radio', { name: /Reserva/ })).toBeChecked()
    await expect(
      page.getByText('Dados do colecionador e rede', { exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByText('Resumo da compra', { exact: true }),
    ).toHaveCount(0)
  } else {
    await form
      .getByRole('checkbox', { name: 'Usar outra carteira?', exact: true })
      .check()
    await chooseOption(
      form.getByLabel('Carteira cadastrada', { exact: true }),
      { label: 'Reserva · polygon' },
    )
  }
  await form
    .getByRole('radio', { name: 'Coinbase Wallet', exact: false })
    .check()
  const dialog = await review(page)
  await expect(dialog).toContainText('polygon')
  await dialog.getByRole('button', { name: 'Voltar à revisão' }).click()
  await expect(visible(page, 'Confirmar compra')).toBeFocused()
  await form.getByRole('radio', { name: /WalletConnect/ }).check()
  await expect
    .poll(async () => (await api(page, 'GET', '/checkout')).data.connection)
    .toBe(null)
  const reconnected = await review(page)
  await reconnected.getByRole('button', { name: 'Voltar à revisão' }).click()
  await mockRequest(page, 'scenario', 'wallet-disconnected')
  const retryReview = await review(page)
  await retryReview
    .getByRole('button', { name: 'Confirmar e enviar pedido' })
    .click()
  await expect(form.getByRole('alert')).toContainText(
    'carteira foi desconectada',
  )
  await expect(visible(page, 'Conectar carteira')).toHaveCount(0)
})

test('revalida uma cotação alterada no envio e exige nova revisão', async ({
  page,
}) => {
  await prepare(page)
  await selectProvider(page)
  const dialog = await review(page)
  await mockRequest(page, 'scenario', 'price-changed')
  await dialog
    .getByRole('button', { name: 'Confirmar e enviar pedido' })
    .click()
  await expect(page.getByRole('alert')).toContainText('Os valores mudaram')
  await expect(page).toHaveURL('/pagamento')
  await expect(
    page.getByText('2.166 ETH', { exact: true }).filter({ visible: true }),
  ).toHaveCount(1)
  await send(page)
  await confirmed(page)
  await expect(
    page.getByRole('list', { name: 'Itens do pedido' }),
  ).toContainText('2.15 ETH')
})
test('Socket.IO atualiza a revisão e impede envio com edição esgotada', async ({
  page,
}) => {
  await prepare(page)
  await selectProvider(page)
  const dialog = await review(page)
  await mockRequest(page, 'nfts/emerald-ape-042', { available: 0 })
  await expect(dialog.getByRole('alert')).toContainText('valores mudaram')
  await expect(
    dialog.getByRole('button', { name: 'Confirmar e enviar pedido' }),
  ).toBeDisabled()
  await dialog.getByRole('button', { name: 'Voltar à revisão' }).click()
  await expect(page.getByRole('alert')).toContainText('disponibilidade')
  expect((await api(page, 'GET', '/cart')).data.items).toHaveLength(1)
})
test('recusa pagamento sem recibo e mantém os itens para uma nova tentativa', async ({
  page,
}) => {
  await prepare(page)
  await selectProvider(page)
  await mockRequest(page, 'scenario', 'payment-declined')
  await send(page)
  await expect(
    page.getByRole('heading', { name: 'Pagamento recusado', exact: true }),
  ).toBeVisible()
  const rejectedUrl = page.url()
  await expect(
    page.getByRole('heading', {
      name: 'Seus NFTs agora estão na sua carteira',
    }),
  ).toHaveCount(0)
  expect((await api(page, 'GET', '/cart')).data.items).toHaveLength(1)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Pagamento recusado', exact: true }),
  ).toBeVisible()
  await mockRequest(page, 'scenario', 'default')
  await page
    .getByRole('link', { name: 'Tentar novamente', exact: true })
    .click()
  await send(page)
  await confirmed(page)
  expect(page.url()).not.toBe(rejectedUrl)
})
test('impede duplicação por clique repetido e rejeita reutilizar a chave com outro conteúdo', async ({
  page,
}) => {
  await prepare(page)
  await selectProvider(page)
  await mockRequest(page, 'scenario', 'order-pending')
  const requests: { key: string; input: unknown }[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/orders')
      requests.push({
        key: r.headers()['idempotency-key'],
        input: r.postDataJSON(),
      })
  })
  const dialog = await review(page)
  await dialog
    .getByRole('button', { name: 'Confirmar e enviar pedido' })
    .dblclick()
  await expect(
    page.getByRole('heading', { name: 'Pedido em processamento' }),
  ).toBeVisible()
  expect(requests).toHaveLength(1)
  const first = requests[0]
  const original = await api(page, 'POST', '/orders', first.input, {
    'Idempotency-Key': first.key,
  })
  expect(original.status).toBe(201)
  expect(page.url()).toContain(original.data.id)
  const input = first.input as { collector: Record<string, unknown> }
  const conflict = await api(
    page,
    'POST',
    '/orders',
    { ...input, collector: { ...input.collector, notes: 'outro conteúdo' } },
    { 'Idempotency-Key': first.key },
  )
  expect(conflict.status).toBe(409)
  expect(conflict.data.code).toBe('IDEMPOTENCY_CONFLICT')
  await mockRequest(page, `orders/${original.data.id}/settle`, 'confirmed')
  await confirmed(page)
  const repeated = await api(page, 'POST', '/orders', first.input, {
    'Idempotency-Key': first.key,
  })
  expect(repeated.data.id).toBe(original.data.id)
  expect(repeated.data.status).toBe('confirmed')
})
test('recupera o mesmo pedido após timeout e refresh sem enviar outra compra', async ({
  page,
}) => {
  await prepare(page)
  await selectProvider(page)
  await mockRequest(page, 'scenario', 'order-timeout')
  const dialog = await review(page)
  await dialog
    .getByRole('button', { name: 'Confirmar e enviar pedido' })
    .click()
  await expect(visible(page, 'Recuperar pedido')).toBeEnabled({ timeout: 8000 })
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kurio:attempt:ana')!),
  )
  const expected = await api(page, 'GET', `/orders?attempt=${stored.key}`)
  expect(expected.data.order.status).toBe('confirmed')
  await page.reload()
  await confirmed(page)
  await expect(page).toHaveURL(`/pedidos/${expected.data.order.id}`)
  expect((await api(page, 'GET', '/cart')).data.items).toHaveLength(0)
})
test('recupera pedido pendente após reconectar, ignora eventos antigos e preserva itens adicionados depois', async ({
  page,
}) => {
  await prepare(page)
  await selectProvider(page)
  await mockRequest(page, 'scenario', 'order-pending')
  await send(page)
  await expect(
    page.getByRole('heading', { name: 'Pedido em processamento' }),
  ).toBeVisible()
  const url = page.url(),
    id = url.split('/').at(-1)!
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Pedido em processamento' }),
  ).toBeVisible()
  await expect
    .poll(
      async () =>
        (
          await page.evaluate(async () =>
            (await fetch('/api/__mock/state')).json(),
          )
        ).orderSubscribers,
    )
    .toBe(1)
  await mockRequest(page, 'orders-online', false)
  await expect(
    page.getByText('Conexão interrompida.', { exact: false }),
  ).toBeVisible()
  expect(
    (
      await api(page, 'POST', '/cart/items', {
        nftId: 'emerald-ape-042',
        editionId: 'fifty',
        quantity: 1,
      })
    ).status,
  ).toBe(201)
  expect(
    (
      await api(page, 'POST', '/cart/items', {
        nftId: 'sage-nomad-009',
        editionId: 'fifty',
        quantity: 1,
      })
    ).status,
  ).toBe(201)
  await mockRequest(page, `orders/${id}/settle`, 'confirmed')
  await mockRequest(page, 'orders-online', true)
  await confirmed(page)
  const stale = {
    eventId: '10101010-1010-4010-8010-101010101010',
    resourceId: id,
    userId: 'ana',
    version: 1,
    status: 'pending',
  }
  await mockRequest(page, 'order-events', stale)
  await mockRequest(page, 'order-events', stale)
  await confirmed(page)
  await page
    .getByRole('link', { name: 'Fechar recibo e voltar ao catálogo' })
    .click()
  await page.goto('/carrinho')
  const list = page.getByRole('list', { name: 'NFTs no carrinho' })
  await expect(list.getByRole('listitem')).toHaveCount(2)
  await expect(
    list
      .getByRole('listitem')
      .filter({ hasText: 'Emerald Ape #042' })
      .getByRole('status'),
  ).toHaveText('1')
})
test('preserva rascunho na expiração e isola pedidos e subscriptions entre contas', async ({
  page,
  isMobile,
}) => {
  await page.clock.install()
  await prepare(page)

  if (isMobile) await visible(page, 'Trocar carteira').click()
  else
    await page
      .getByLabel('Observação do colecionador (opcional)')
      .fill('Guardar meu contexto')
  await mockRequest(page, 'session/expire', undefined)
  await page.clock.fastForward(16_000)
  await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
  await login(page)
  await expect(page).toHaveURL('/pagamento')

  if (isMobile)
    await expect(page.getByRole('radio', { name: /Reserva/ })).toBeChecked()
  else
    await expect(
      page.getByLabel('Observação do colecionador (opcional)'),
    ).toHaveValue('Guardar meu contexto')
  await selectProvider(page)
  await mockRequest(page, 'scenario', 'order-pending')
  await send(page)
  await expect(
    page.getByRole('heading', { name: 'Pedido em processamento' }),
  ).toBeVisible()
  const url = page.url()
  await mockRequest(page, 'session/expire', undefined)
  await page.clock.fastForward(16_000)
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await login(page, 'bruno@kurio.demo')
  await expect(page).toHaveURL(url)
  await expect(
    page.getByRole('heading', {
      name: 'Pedido não encontrado para esta conta',
    }),
  ).toBeVisible()
  await expect
    .poll(
      async () =>
        (
          await page.evaluate(async () =>
            (await fetch('/api/__mock/state')).json(),
          )
        ).orderSubscribers,
    )
    .toBe(1)
  await page.goto('/pagamento')
  await expect(
    page.getByRole('heading', { name: 'Seu carrinho está vazio' }),
  ).toBeVisible()
})
test('recupera falhas 503 da consulta e mostra skeleton no carregamento lento', async ({
  page,
}) => {
  await prepare(page)
  await mockRequest(page, 'scenario', 'checkout-error')
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar o pagamento',
  )
  await mockRequest(page, 'scenario', 'default')
  await visible(page, 'Tentar novamente').click()
  await expect(
    page.getByRole('form', { name: 'Pagamento', exact: true }),
  ).toBeVisible()
  await mockRequest(page, 'scenario', 'slow')
  await page.reload()
  await expect(
    page.getByRole('status', { name: 'Carregando pagamento' }),
  ).toBeVisible()
  await expect(
    page.getByRole('form', { name: 'Pagamento', exact: true }),
  ).toBeVisible()
})
test('reenvia a mesma tentativa após indisponibilidade sem criar outro pedido', async ({
  page,
}) => {
  await prepare(page)
  await selectProvider(page)
  await mockRequest(page, 'scenario', 'order-error')
  const keys: string[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/orders')
      keys.push(r.headers()['idempotency-key'])
  })
  const dialog = await review(page)
  await dialog
    .getByRole('button', { name: 'Confirmar e enviar pedido' })
    .click()
  await expect(visible(page, 'Recuperar pedido')).toBeEnabled()
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível enviar o pedido',
  )
  await mockRequest(page, 'scenario', 'default')
  await visible(page, 'Recuperar pedido').click()
  await confirmed(page)
  expect(keys).toHaveLength(2)
  expect(keys[0]).toBe(keys[1])
})
test('mantém a composição visual do pagamento e não cria overflow', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await prepare(page)
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length)
        .map((i) => i.decode()),
    )
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await expect(page).toHaveScreenshot('pagamento.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixels: 3000,
  })
})
