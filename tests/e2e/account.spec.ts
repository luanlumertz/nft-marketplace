import { test, expect, type Page } from '@playwright/test'
import { mockRequest } from './helpers'

const visibleButton = (page: Page, name: string | RegExp) =>
  page
    .getByRole('button', { name, exact: typeof name === 'string' })
    .filter({ visible: true })
async function completeLogin(
  page: Page,
  email = 'ana@kurio.demo',
  password = 'Kurio123!',
) {
  const form = page.getByRole('form', { name: 'Entrar na Kurio' })
  await form.getByLabel('E-mail', { exact: true }).fill(email)
  await form.getByLabel('Senha', { exact: true }).fill(password)
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
}
async function signIn(page: Page, path = '/perfil') {
  await page.goto(path)
  await completeLogin(page)
  await expect(page).toHaveURL(path)
}
async function logout(page: Page) {
  await visibleButton(page, /^(Sair|Sair da conta)$/).click()
  await expect(page).toHaveURL('/')
}
async function fillWallet(
  page: Page,
  address = '0x1111111111111111111111111111111111111111',
) {
  const form = page.getByRole('form', {
    name: 'Carteira principal',
    exact: true,
  })
  await form
    .getByLabel('Apelido da carteira', { exact: false })
    .fill('Principal')
  await form.getByLabel('Rede', { exact: false }).selectOption('ethereum')
  await form.getByLabel('Nome do perfil', { exact: false }).fill('ana')
  await form.getByLabel('Endereço da carteira', { exact: false }).fill(address)
  await form
    .getByLabel('Tipo de carteira', { exact: false })
    .selectOption('metamask')
  await form.getByLabel('Código de indicação', { exact: false }).fill('KURIO')
  await form.getByLabel('Nome ENS', { exact: false }).fill('ana')
  return form
}

test('protege perfil e carteiras e retoma o acesso direto após login', async ({
  page,
}) => {
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.goto('/carteiras')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await completeLogin(page)
  await expect(page).toHaveURL('/carteiras')
  await expect(
    page.getByRole('form', { name: 'Carteira principal', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Você ainda não adicionou uma carteira secundária.'),
  ).toBeVisible()
})

test('valida perfil, trata conflito e persiste os dados com a sessão atualizada', async ({
  page,
}) => {
  await signIn(page)
  const form = page.getByRole('form', { name: 'Dados do perfil', exact: true })
  await form.getByLabel('Nome de exibição', { exact: false }).fill('')
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(
    form.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveAttribute('aria-invalid', 'true')
  await form
    .getByLabel('Nome de exibição', { exact: false })
    .fill('Ana Colecionadora')
  await form.getByLabel('E-mail', { exact: false }).fill('bruno@kurio.demo')
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(form.getByRole('alert')).toContainText('já está cadastrado')
  await page.reload()
  await expect(
    form.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana Costa')
  await form
    .getByLabel('Nome de exibição', { exact: false })
    .fill('Ana Colecionadora')
  await form.getByLabel('Nome de usuário', { exact: false }).fill('ana.colecao')
  await form.getByLabel('E-mail', { exact: false }).fill('ana.nova@kurio.demo')
  await form.getByLabel('Nome ENS', { exact: false }).fill('ana-colecao')
  await form
    .getByLabel('Apelido da carteira', { exact: false })
    .fill('Minha carteira')
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(form.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.reload()
  await expect(
    form.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana Colecionadora')
  await expect(form.getByLabel('E-mail', { exact: false })).toHaveValue(
    'ana.nova@kurio.demo',
  )
  await expect(form.getByLabel('Nome ENS', { exact: false })).toHaveValue(
    'ana-colecao',
  )
})

test('valida, envia, persiste e remove o avatar', async ({ page }) => {
  await signIn(page)
  const form = page.getByRole('form', { name: 'Dados do perfil', exact: true })
  const upload = form.getByLabel('Selecionar avatar', { exact: true })
  await upload.setInputFiles({
    name: 'arquivo.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('invalid'),
  })
  await expect(form.getByRole('alert')).toContainText('512 KB')
  await form.getByRole('button', { name: 'Remover', exact: true }).click()
  const avatarPng = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 2
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await upload.setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(avatarPng, 'base64'),
  })
  await expect(
    form.getByRole('img', { name: 'Avatar de Ana Costa' }),
  ).toBeVisible()
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(form.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.reload()
  await expect(
    form.getByRole('img', { name: 'Avatar de Ana Costa' }),
  ).toBeVisible()
  await form.getByRole('button', { name: 'Remover', exact: true }).click()
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(form.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page.reload()
  await expect(form.getByRole('img')).toHaveCount(0)
})

test('troca senha de forma atômica e aceita apenas a credencial nova após logout', async ({
  page,
}) => {
  await signIn(page)
  const form = page.getByRole('form', { name: 'Dados do perfil', exact: true })
  await form
    .getByLabel('Nome de exibição', { exact: false })
    .fill('Não salvar parcialmente')
  await form.getByLabel('Senha atual', { exact: true }).fill('incorreta')
  await form.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!')
  await form
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('diferente')
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(
    form.getByLabel('Confirmar nova senha', { exact: true }),
  ).toHaveAttribute('aria-invalid', 'true')
  await form
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('NovaSenha123!')
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(form.getByRole('alert')).toContainText('senha atual')
  await page.reload()
  await expect(
    form.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Ana Costa')
  await form.getByLabel('Senha atual', { exact: true }).fill('Kurio123!')
  await form.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!')
  await form
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('NovaSenha123!')
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(form.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  expect(
    await page.evaluate(() => localStorage.getItem('kurio:accounts:v1')),
  ).not.toContain('NovaSenha123!')
  await logout(page)
  await page.goto('/perfil')
  await completeLogin(page)
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText(
    'incorretos',
  )
  await completeLogin(page, 'ana@kurio.demo', 'NovaSenha123!')
  await expect(page).toHaveURL('/perfil')
})

test('cadastra, espelha e edita carteiras principal e secundária com persistência', async ({
  page,
}) => {
  await signIn(page, '/carteiras')
  const form = await fillWallet(page, '0x123')
  await form
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(
    form.getByLabel('Endereço da carteira', { exact: false }),
  ).toHaveAttribute('aria-invalid', 'true')
  await form
    .getByLabel('Endereço da carteira', { exact: false })
    .fill('0x1111111111111111111111111111111111111111')
  await form
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  const primary = page.getByRole('region', {
    name: 'Carteira principal',
    exact: true,
  })
  const secondary = page.getByRole('region', {
    name: 'Carteira secundária',
    exact: true,
  })
  await expect(primary.getByRole('status')).toHaveText(
    'Carteira salva com sucesso.',
  )
  await page
    .getByRole('checkbox', { name: 'Igual à carteira principal' })
    .check()
  await expect(secondary.getByRole('status')).toHaveText(
    'Carteira salva com sucesso.',
  )
  await page.reload()
  await expect(
    page.getByRole('checkbox', { name: 'Igual à carteira principal' }),
  ).toBeChecked()
  await primary.getByRole('button', { name: 'Editar', exact: true }).click()
  await primary
    .getByLabel('Endereço da carteira', { exact: false })
    .fill('0x2222222222222222222222222222222222222222')
  await primary
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(
    secondary.getByLabel('Endereço da carteira secundária'),
  ).toHaveText('0x2222222222222222222222222222222222222222')
  await page
    .getByRole('checkbox', { name: 'Igual à carteira principal' })
    .uncheck()
  await secondary.getByLabel('Rede', { exact: false }).selectOption('polygon')
  await secondary
    .getByLabel('Endereço da carteira', { exact: false })
    .fill('0x3333333333333333333333333333333333333333')
  await secondary
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(secondary.getByRole('status')).toHaveText(
    'Carteira salva com sucesso.',
  )
  await page.reload()
  await expect(
    page.getByRole('checkbox', { name: 'Igual à carteira principal' }),
  ).not.toBeChecked()
  await expect(secondary).toContainText('Polygon')
  await expect(
    secondary.getByLabel('Endereço da carteira secundária'),
  ).toHaveText('0x3333333333333333333333333333333333333333')
})

test('valida rede e recupera conflitos e indisponibilidade sem perder carteiras', async ({
  page,
}) => {
  await signIn(page, '/carteiras')
  const form = await fillWallet(page)
  await form.getByLabel('Rede', { exact: false }).selectOption('solana')
  await form
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(
    form.getByLabel('Endereço da carteira', { exact: false }),
  ).toHaveAttribute('aria-invalid', 'true')
  await form
    .getByLabel('Endereço da carteira', { exact: false })
    .fill('So11111111111111111111111111111111111111112')
  await mockRequest(page, 'scenario', 'wallet-conflict')
  await form
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(form.getByRole('alert')).toContainText(
    'Não foi possível vincular',
  )
  await mockRequest(page, 'scenario', 'default')
  await form
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(
    page
      .getByRole('region', { name: 'Carteira principal', exact: true })
      .getByRole('status'),
  ).toHaveText('Carteira salva com sucesso.')
  await expect(
    page.getByRole('region', { name: 'Carteira principal', exact: true }),
  ).toContainText('Solana')
  await mockRequest(page, 'scenario', 'wallets-error')
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar suas carteiras',
  )
  await mockRequest(page, 'scenario', 'default')
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click()
  await expect(page.getByLabel('Endereço da carteira principal')).toHaveText(
    'So11111111111111111111111111111111111111112',
  )
})

test('isola o perfil entre contas e retoma a página após sessão expirada', async ({
  page,
}) => {
  await page.clock.install()
  await signIn(page)
  const form = page.getByRole('form', { name: 'Dados do perfil', exact: true })
  await form
    .getByLabel('Nome de exibição', { exact: false })
    .fill('Ana Personalizada')
  await form.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(form.getByRole('status')).toHaveText('Perfil salvo com sucesso.')
  await page
    .getByRole('link', { name: 'Carteiras', exact: true })
    .filter({ visible: true })
    .click()
  const ownWallet = await fillWallet(page)
  await ownWallet
    .getByRole('button', { name: 'Salvar carteira', exact: true })
    .click()
  await expect(
    page
      .getByRole('region', { name: 'Carteira principal', exact: true })
      .getByRole('status'),
  ).toHaveText('Carteira salva com sucesso.')
  await logout(page)
  await page
    .getByRole('link', { name: /^(Entrar|Entrar na conta)$/, exact: true })
    .filter({ visible: true })
    .click()
  await completeLogin(page, 'bruno@kurio.demo')
  await visibleButton(page, 'Abrir conta de Bruno Lima').click()
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Dados do perfil', exact: true })
    .click()
  await expect(
    form.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Bruno Lima')
  await page
    .getByRole('link', { name: 'Carteiras', exact: true })
    .filter({ visible: true })
    .click()
  await expect(
    page
      .getByRole('form', { name: 'Carteira principal', exact: true })
      .getByLabel('Endereço da carteira', { exact: false }),
  ).toHaveValue('')
  await page
    .getByRole('link', { name: 'Dados do perfil', exact: true })
    .filter({ visible: true })
    .click()
  await expect(page).toHaveURL('/perfil')
  await expect(
    form.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Bruno Lima')
  await mockRequest(page, 'session/expire', null)
  await page.clock.fastForward(16_000)
  await expect(
    page.getByRole('form', { name: 'Entrar na Kurio' }),
  ).toBeVisible()
  await completeLogin(page, 'bruno@kurio.demo')
  await expect(page).toHaveURL('/perfil')
  await expect(
    form.getByLabel('Nome de exibição', { exact: false }),
  ).toHaveValue('Bruno Lima')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
