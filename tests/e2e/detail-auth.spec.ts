import { test, expect, type Page } from '@playwright/test'
import { mockRequest } from './helpers'

async function signIn(
  page: Page,
  email = 'ana@kurio.demo',
  redirect = '/favoritos',
) {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  const form = page.getByRole('form', { name: 'Entrar na Kurio' })
  await form.getByLabel('E-mail', { exact: true }).fill(email)
  await form.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(new URL(redirect, page.url()).href)
}
const favorite = (page: Page, active: boolean) =>
  page
    .getByRole('button', {
      name: `${active ? 'Remover dos favoritos' : 'Favoritar'} Emerald Ape #042`,
    })
    .filter({ visible: true })

test('seleciona edição e quantidade com limites e mantém a seleção no refresh', async ({
  page,
}) => {
  await page.goto('/nfts/emerald-ape-042')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
  const gallery = page.getByRole('button', { name: 'Abrir galeria de imagens' })
  await gallery.click()
  await page.getByRole('button', { name: 'Próxima imagem' }).click()
  await page.keyboard.press('Escape')
  await expect(gallery).toBeFocused()
  await expect(
    page.getByRole('button', { name: '1/1', exact: true }),
  ).toBeDisabled()
  const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
  for (let index = 0; index < 3; index++) await increase.click()
  await expect(
    page.getByRole('status', { name: 'Quantidade selecionada' }),
  ).toHaveText('4')
  await expect(increase).toBeDisabled()
  await page.reload()
  await expect(
    page.getByRole('status', { name: 'Quantidade selecionada' }),
  ).toHaveText('4')
  await page.getByRole('button', { name: '1/10', exact: true }).click()
  await expect(
    page.getByRole('status', { name: 'Quantidade selecionada' }),
  ).toHaveText('1')
  await expect(
    page.getByText('2.38 ETH', { exact: true }).filter({ visible: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('retoma o favorito após login e persiste após refresh', async ({
  page,
}) => {
  await page.goto('/nfts/emerald-ape-042?edition=fifty&quantity=2')
  await favorite(page, false).click()
  const form = page.getByRole('form', { name: 'Entrar na Kurio' })
  await form.getByLabel('E-mail', { exact: true }).fill('ana@kurio.demo')
  await form.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(
    /\/nfts\/emerald-ape-042\?edition=fifty&quantity=2/,
  )
  await expect(favorite(page, true)).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(favorite(page, true)).toHaveAttribute('aria-pressed', 'true')
})

test('faz rollback do favorito e exige login quando a sessão expira', async ({
  page,
}) => {
  await page.clock.install()
  await signIn(page, 'ana@kurio.demo', '/nfts/emerald-ape-042')
  await favorite(page, false).click()
  await expect(favorite(page, true)).toBeEnabled()
  await mockRequest(page, 'scenario', 'favorite-error')
  await favorite(page, true).click()
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText(
    'Tente novamente',
  )
  await expect(favorite(page, true)).toHaveAttribute('aria-pressed', 'true')
  await mockRequest(page, 'scenario', 'default')
  await mockRequest(page, 'session/expire', null)
  // Dispara a revalidação periódica via REST sem disputar um clique ou reload
  // com outra consulta que também pode detectar a expiração.
  await page.clock.fastForward(16_000)
  await expect(
    page.getByRole('form', { name: 'Entrar na Kurio' }),
  ).toBeVisible()
  await expect(
    page.getByText('Sua sessão expirou. Entre novamente para continuar.'),
  ).toBeVisible()
  await expect(page).toHaveURL(/redirect=/)
  const form = page.getByRole('form', { name: 'Entrar na Kurio' })
  await form.getByLabel('E-mail', { exact: true }).fill('ana@kurio.demo')
  await form.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/nfts/emerald-ape-042')
  await expect(favorite(page, true)).toHaveAttribute('aria-pressed', 'true')
})

test('isola favoritos depois de logout e troca de usuário', async ({
  page,
}) => {
  await signIn(page)
  await expect(
    page.getByRole('heading', { name: 'Sage Nomad #009' }),
  ).toBeVisible()
  const account = page
    .getByRole('button', { name: 'Abrir conta de Ana Costa' })
    .filter({ visible: true })
  await account.click()
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('list', { name: 'NFTs da coleção' }),
  ).toBeVisible()
  await signIn(page, 'bruno@kurio.demo')
  await expect(
    page.getByRole('heading', { name: 'Golden Beat #207' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Sage Nomad #009' }),
  ).toHaveCount(0)
})

test('valida cadastro, trata conflito e persiste conta sem senha em claro', async ({
  page,
}) => {
  await page.goto('/cadastro')
  const form = page.getByRole('form', { name: 'Criar conta' })
  await form.getByLabel('Nome de usuário', { exact: true }).fill('Nova Coleção')
  await form.getByLabel('E-mail', { exact: true }).fill('ana@kurio.demo')
  await form.getByLabel('Senha', { exact: true }).fill('Nova12345!')
  await form.getByLabel('Confirmar senha', { exact: true }).fill('outra senha')
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(form.getByText('As senhas precisam ser iguais.')).toBeVisible()
  await form.getByLabel('Confirmar senha', { exact: true }).fill('Nova12345!')
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(form.getByLabel('E-mail', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(
    form.getByText('Este e-mail já está cadastrado.', { exact: true }).first(),
  ).toBeVisible()
  await form.getByLabel('E-mail', { exact: true }).fill('nova@kurio.demo')
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.reload()
  await expect(
    page
      .getByRole('button', { name: 'Abrir conta de Nova Coleção' })
      .filter({ visible: true }),
  ).toBeVisible()
  const persisted = await page.evaluate(() =>
    localStorage.getItem('kurio:accounts:v1'),
  )
  expect(persisted).not.toContain('Nova12345!')
})
