import { useRef, useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/session'
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
import { useSaveWallet } from './queries'

type WalletDraft = Omit<WalletFields, 'network' | 'provider'> & {
  network: WalletFields['network'] | ''
  provider: WalletFields['provider'] | ''
}
export function WalletForm({
  slot,
  wallet,
  onSaved,
  onDeleted,
}: {
  slot: WalletSlot
  wallet?: Wallet
  onSaved: () => void
  onDeleted?: () => void
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
  const { mutation, pending, save, removeSecondary } = useSaveWallet()
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
        className="grid grid-cols-2 gap-x-7 gap-y-8 mobile:grid-cols-1 mobile:gap-5"
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
      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-10 rounded-xs font-semibold mobile:h-12 mobile:w-full mobile:rounded-lg"
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
        {onDeleted && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="h-10 rounded-xs border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive mobile:h-12 mobile:w-full mobile:rounded-lg"
            onClick={() => removeSecondary(onDeleted)}
          >
            Excluir carteira
          </Button>
        )}
      </div>
    </form>
  )
}
