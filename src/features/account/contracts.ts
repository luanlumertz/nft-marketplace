import { z } from 'zod'
import { emailSchema } from '@/features/auth/contracts'

export const avatarMaxBytes = 512 * 1024
const requiredText = (label: string, max = 60) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${label}.`)
    .max(max, `Use até ${max} caracteres.`)
export const ensNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.eth$/,
    'Informe um nome ENS com 3 a 63 caracteres antes de .eth.',
  )
export const avatarSchema = z
  .string()
  .max(
    Math.ceil((avatarMaxBytes * 4) / 3) + 40,
    'Use uma imagem de até 512 KB.',
  )
  .regex(
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
    'Use uma imagem PNG, JPEG ou WebP.',
  )
  .refine((value) => {
    try {
      const [header, payload] = value.split(',')
      const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
      if (Math.floor((payload.length * 3) / 4) - padding > avatarMaxBytes)
        return false
      const bytes = atob(payload.slice(0, 32))
      if (header === 'data:image/png;base64')
        return bytes.startsWith('\x89PNG\r\n\x1a\n')
      if (header === 'data:image/jpeg;base64')
        return bytes.startsWith('\xff\xd8\xff')
      return (
        header === 'data:image/webp;base64' &&
        bytes.startsWith('RIFF') &&
        bytes.slice(8, 12) === 'WEBP'
      )
    } catch {
      return false
    }
  }, 'O conteúdo do arquivo não corresponde a uma imagem PNG, JPEG ou WebP.')
  .nullable()
export const profileFieldsSchema = z.object({
  name: requiredText('o nome de exibição', 40).min(
    3,
    'Use pelo menos 3 caracteres.',
  ),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9._-]{2,29}$/,
      'Use de 3 a 30 letras, números, pontos, traços ou sublinhados.',
    ),
  email: emailSchema,
  ensName: ensNameSchema,
  walletAlias: requiredText('o apelido da carteira', 40),
  avatarUrl: avatarSchema,
})
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Informe a senha atual.')
      .max(128, 'Use até 128 caracteres.'),
    newPassword: z
      .string()
      .min(8, 'Use pelo menos 8 caracteres.')
      .max(128, 'Use até 128 caracteres.'),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword)
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas precisam ser iguais.',
      })
    if (value.currentPassword === value.newPassword)
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Escolha uma senha diferente da atual.',
      })
  })
export const profileUpdateSchema = profileFieldsSchema.extend({
  passwordChange: passwordChangeSchema.optional(),
})
export const profileSchema = profileFieldsSchema.extend({ id: z.string() })
export type Profile = z.infer<typeof profileSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>

export const walletNetworks = [
  ['ethereum', 'Ethereum'],
  ['polygon', 'Polygon'],
  ['solana', 'Solana'],
] as const
export const walletProviders = [
  ['metamask', 'MetaMask'],
  ['walletconnect', 'WalletConnect'],
  ['coinbase', 'Coinbase'],
] as const
export const walletSlotSchema = z.enum(['primary', 'secondary'])
export type WalletSlot = z.infer<typeof walletSlotSchema>
function validAddress(address: string, network: string) {
  if (network !== 'solana')
    return /^0x[0-9a-fA-F]{40}$/.test(address) && !/^0x0{40}$/.test(address)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let value = 0n
  for (const char of address)
    value = value * 58n + BigInt(alphabet.indexOf(char))
  const leadingZeros = address.match(/^1*/)?.[0].length ?? 0
  return (
    value > 0n && leadingZeros + Math.ceil(value.toString(16).length / 2) === 32
  )
}
export const walletFieldsSchema = z
  .object({
    displayName: requiredText('o nome de exibição', 40),
    walletAlias: requiredText('o apelido da carteira', 40),
    network: z.enum(['ethereum', 'polygon', 'solana'], {
      error: 'Selecione uma rede.',
    }),
    profileName: requiredText('o nome do perfil', 40),
    address: requiredText('o endereço da carteira', 100),
    secondaryAddress: z.string().trim().max(100, 'Use até 100 caracteres.'),
    provider: z.enum(['metamask', 'walletconnect', 'coinbase'], {
      error: 'Selecione uma carteira.',
    }),
    referralCode: z
      .string()
      .trim()
      .min(1, 'Informe o código de indicação.')
      .max(40)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Use letras, números, traços ou sublinhados.'),
    email: emailSchema,
    ensName: ensNameSchema,
    sameAsPrimary: z.boolean(),
  })
  .superRefine((wallet, context) => {
    if (!validAddress(wallet.address, wallet.network))
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          wallet.network === 'solana'
            ? 'Informe um endereço Solana Base58 de 32 bytes.'
            : 'Informe um endereço 0x com 40 dígitos hexadecimais.',
      })
    if (
      wallet.secondaryAddress &&
      !validAddress(wallet.secondaryAddress, wallet.network) &&
      !(
        wallet.network === 'ethereum' &&
        ensNameSchema.safeParse(wallet.secondaryAddress).success
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['secondaryAddress'],
        message:
          'Informe um endereço válido para a rede ou um ENS .eth na Ethereum.',
      })
  })
export const walletSchema = walletFieldsSchema.safeExtend({
  id: z.string(),
  slot: walletSlotSchema,
})
export const walletsSchema = z.object({ items: z.array(walletSchema).max(2) })
export const walletSaveSchema = z.union([
  z.object({ sameAsPrimary: z.literal(true) }).strict(),
  walletFieldsSchema,
])
export type Wallet = z.infer<typeof walletSchema>
export type WalletFields = z.infer<typeof walletFieldsSchema>
export type WalletSave = z.infer<typeof walletSaveSchema>
export type Wallets = z.infer<typeof walletsSchema>
