import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/session'
import { AccountShell } from './account-shell'
import { apiFailure, validationErrors, type FieldErrors } from './form-feedback'
import { AccountField } from './account-field'
import {
  walletFieldsSchema,
  walletNetworks,
  walletProviders,
  type Wallet,
  type WalletFields,
  type WalletSlot,
} from './contracts'
import { useSaveWallet, walletsOptions } from './queries'

type WalletDraft = Omit<WalletFields, 'network' | 'provider'> & {
  network: WalletFields['network'] | ''
  provider: WalletFields['provider'] | ''
}
function WalletForm({
  slot,
  wallet,
  onSaved,
}: {
  slot: WalletSlot
  wallet?: Wallet
  onSaved: () => void
}) {
  const session = useSession()
  const [draft, setDraft] = useState<WalletDraft>(() =>
    wallet
      ? { ...wallet, sameAsPrimary: false }
      : {
          displayName: session.data?.user?.name ?? '',
          walletAlias: '',
          network: '',
          profileName: '',
          address: '',
          secondaryAddress: '',
          provider: '',
          referralCode: '',
          email: session.data?.user?.email ?? '',
          ensName: '.eth',
          sameAsPrimary: false,
        },
  )
  const [fields, setFields] = useState<FieldErrors>({})
  const { mutation, pending, save } = useSaveWallet()
  const failure = apiFailure(mutation.error),
    errors = { ...failure.fieldErrors, ...fields }
  const form = useRef<HTMLFormElement>(null)
  const field = (key: Exclude<keyof WalletDraft, 'sameAsPrimary'>) => ({
    name: key,
    value: draft[key],
    error: errors[key]?.[0],
    onValueChange: (value: string) => {
      setDraft((previous) => ({ ...previous, [key]: value }))
      setFields((previous) => ({ ...previous, [key]: undefined }))
      mutation.reset()
    },
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const parsed = walletFieldsSchema.safeParse(draft)
    if (!parsed.success) {
      setFields(validationErrors(parsed.error))
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      )
      return
    }
    setFields({})
    save(slot, parsed.data, onSaved)
  }
  return (
    <form
      id={`wallet-${slot}`}
      ref={form}
      onSubmit={submit}
      noValidate
      aria-label={
        slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'
      }
      className="mt-8"
    >
      <fieldset
        disabled={pending}
        className="grid grid-cols-2 gap-x-7 gap-y-8 [&_label]:mb-0 [&_label]:leading-4 mobile:grid-cols-1 mobile:gap-5 mobile:[&_label]:mb-2 mobile:[&_label]:leading-5"
      >
        <AccountField
          label="Nome de exibição"
          required
          maxLength={40}
          {...field('displayName')}
        />
        <AccountField
          label="Apelido da carteira"
          required
          maxLength={40}
          {...field('walletAlias')}
        />
        <AccountField
          label="Rede"
          required
          options={walletNetworks}
          placeholder="Selecione uma rede"
          {...field('network')}
        />
        <AccountField
          label="Nome do perfil"
          required
          maxLength={40}
          {...field('profileName')}
        />
        <AccountField
          label="Endereço da carteira"
          required
          maxLength={100}
          placeholder={
            draft.network === 'solana'
              ? 'Endereço Solana da carteira'
              : 'Endereço 0x da carteira'
          }
          {...field('address')}
        />
        <AccountField
          label="ENS ou carteira secundária (opcional)"
          maxLength={100}
          placeholder="ENS ou carteira secundária (opcional)"
          {...field('secondaryAddress')}
        />
        <AccountField
          label="Tipo de carteira"
          required
          options={walletProviders}
          placeholder="Selecione uma carteira"
          {...field('provider')}
        />
        <AccountField
          label="Código de indicação"
          required
          maxLength={40}
          {...field('referralCode')}
        />
        <AccountField
          label="E-mail"
          required
          type="email"
          autoComplete="email"
          {...field('email')}
        />
        <AccountField
          label="Nome ENS"
          name="ensName"
          required
          ens
          value={draft.ensName.replace(/\.eth$/i, '')}
          onValueChange={(value) => {
            setDraft((previous) => ({
              ...previous,
              ensName: `${value.replace(/\.eth$/i, '')}.eth`,
            }))
            setFields((previous) => ({ ...previous, ensName: undefined }))
            mutation.reset()
          }}
          error={errors.ensName?.[0]}
          maxLength={67}
        />
      </fieldset>
      {failure.message && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {failure.message}
        </p>
      )}
      {Object.values(fields).some((error) => error?.length) && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          Confira os campos destacados.
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="mt-8 h-10 rounded-xs font-semibold mobile:h-12 mobile:w-full mobile:rounded-lg"
      >
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Salvando…
          </>
        ) : (
          'Salvar carteira'
        )}
      </Button>
    </form>
  )
}
function WalletSection({
  slot,
  wallet,
  primary,
}: {
  slot: WalletSlot
  wallet?: Wallet
  primary?: Wallet
}) {
  const [editing, setEditing] = useState(slot === 'primary' && !wallet)
  const [saved, setSaved] = useState(false)
  const [mirrorRequested, setMirrorRequested] = useState(false)
  const { mutation, pending, save } = useSaveWallet()
  const title =
    slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'
  const failure = apiFailure(mutation.error)
  return (
    <section
      aria-labelledby={`wallet-title-${slot}`}
      className={slot === 'secondary' ? 'mt-8' : ''}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`wallet-title-${slot}`} className="text-[16px] font-semibold">
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {slot === 'secondary' && (
            <label className="flex cursor-pointer items-center gap-2 text-[13px] has-disabled:cursor-not-allowed has-disabled:opacity-60">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={
                  (mirrorRequested && !mutation.isError) ||
                  (!!wallet?.sameAsPrimary && !editing)
                }
                disabled={!primary || pending}
                onChange={(event) => {
                  setSaved(false)
                  mutation.reset()
                  setMirrorRequested(event.target.checked)
                  if (event.target.checked)
                    save('secondary', { sameAsPrimary: true }, () => {
                      setEditing(false)
                      setSaved(true)
                      setMirrorRequested(false)
                    })
                  else setEditing(true)
                }}
              />
              Igual à carteira principal
            </label>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setEditing(true)
              setSaved(false)
              requestAnimationFrame(() =>
                document
                  .getElementById(`wallet-${slot}`)
                  ?.querySelector('input')
                  ?.focus(),
              )
            }}
            className="min-h-6 text-[16px] font-semibold text-primary"
          >
            {wallet ? 'Editar' : 'Adicionar'}
          </button>
        </div>
      </div>
      {slot === 'primary' && (
        <p className="mt-1 text-[14px] text-muted-foreground">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs
          comprados.
        </p>
      )}
      {editing ? (
        <WalletForm
          key={wallet?.id ?? slot}
          slot={slot}
          wallet={wallet}
          onSaved={() => {
            setEditing(false)
            setSaved(true)
          }}
        />
      ) : wallet ? (
        <div className="mt-5 rounded-xl border border-border bg-card p-5 text-sm">
          <p className="font-semibold">
            {wallet.displayName} · {wallet.walletAlias}
          </p>
          <p className="mt-2 text-muted-foreground">
            {
              walletNetworks.find(
                ([network]) => network === wallet.network,
              )?.[1]
            }{' '}
            ·{' '}
            {
              walletProviders.find(
                ([provider]) => provider === wallet.provider,
              )?.[1]
            }
          </p>
          <p
            className="mt-3 break-all text-primary"
            aria-label={`Endereço da ${title.toLowerCase()}`}
          >
            {wallet.address}
          </p>
          <p className="mt-2 text-muted-foreground">{wallet.ensName}</p>
        </div>
      ) : (
        <p className="mt-2 text-[14px] text-muted-foreground">
          Você ainda não adicionou uma carteira secundária.
        </p>
      )}
      {failure.message && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {failure.message}
        </p>
      )}
      {saved && (
        <p role="status" className="mt-4 text-sm text-primary">
          Carteira salva com sucesso.
        </p>
      )}
    </section>
  )
}
export function WalletsPage() {
  const session = useSession(),
    user = session.data?.user
  const query = useQuery({
    ...walletsOptions(user?.id ?? 'anonymous'),
    enabled: !!user,
  })
  useEffect(() => {
    const previous = document.title
    document.title = 'Carteiras | Kurio'
    return () => {
      document.title = previous
    }
  }, [])
  return (
    <AccountShell active="wallets">
      <h1 className="sr-only">Carteiras</h1>
      {!user ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Entre para acessar suas carteiras.
        </p>
      ) : query.isPending ? (
        <div
          role="status"
          aria-label="Carregando carteiras"
          className="grid grid-cols-2 gap-7 mobile:grid-cols-1"
        >
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-18" />
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="text-sm">
          <p>Não foi possível carregar suas carteiras.</p>
          <Button
            className="mt-4"
            onClick={() => {
              void query.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <WalletSection
            key={`${user.id}-primary`}
            slot="primary"
            wallet={query.data.items.find(
              (wallet) => wallet.slot === 'primary',
            )}
          />
          <WalletSection
            key={`${user.id}-secondary`}
            slot="secondary"
            wallet={query.data.items.find(
              (wallet) => wallet.slot === 'secondary',
            )}
            primary={query.data.items.find(
              (wallet) => wallet.slot === 'primary',
            )}
          />
        </>
      )}
    </AccountShell>
  )
}
