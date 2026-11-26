import { useId } from 'react'
import { AccountField } from '@/features/account/account-field'
import {
  walletNetworks,
  walletProviders,
  type Wallet,
} from '@/features/account/contracts'
import type { FieldErrors } from '@/features/account/form-feedback'
import type { Collector, ConnectionInput } from './contracts'

export function CheckoutFields({
  collector,
  wallet,
  network,
  provider,
  changeNetwork,
  change,
  errors,
}: {
  collector: Collector
  wallet?: Wallet
  network: ConnectionInput['network']
  provider: ConnectionInput['provider']
  changeNetwork: (network: ConnectionInput['network']) => void
  change: (key: keyof Collector, value: string) => void
  errors: FieldErrors
}) {
  const notesErrorId = useId()
  const field = (key: keyof Collector) => ({
    name: key,
    value: collector[key],
    onValueChange: (value: string) => change(key, value),
    error: errors[key]?.[0],
  })
  return (
    <>
      <div className="grid grid-cols-2 items-start gap-x-6 gap-y-5 mobile:grid-cols-1 mobile:gap-5">
        <AccountField
          label="Nome de exibição"
          required
          maxLength={40}
          autoComplete="name"
          {...field('name')}
        />
        <AccountField
          label="Nome de usuário"
          required
          maxLength={30}
          autoComplete="username"
          {...field('username')}
        />
        <AccountField
          label="Rede"
          required
          options={walletNetworks}
          value={network}
          onValueChange={(value) =>
            changeNetwork(value as ConnectionInput['network'])
          }
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
          readOnly
          value={wallet?.address ?? ''}
          placeholder="Cadastre uma carteira"
        />
        <AccountField
          label="ENS ou carteira secundária (opcional)"
          maxLength={100}
          {...field('secondaryAddress')}
        />
        <AccountField
          label="Tipo de carteira"
          required
          readOnly
          value={walletProviders.find(([key]) => key === provider)?.[1] ?? ''}
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
          maxLength={120}
          autoComplete="email"
          {...field('email')}
        />
        <AccountField
          label="Nome ENS"
          required
          ens
          maxLength={63}
          value={collector.ensName.replace(/\.eth$/i, '')}
          onValueChange={(value) =>
            change('ensName', `${value.replace(/\.eth$/i, '')}.eth`)
          }
          error={errors.ensName?.[0]}
        />
      </div>
      <label className="mt-6 block text-sm">
        Observação do colecionador (opcional)
        <textarea
          name="notes"
          maxLength={500}
          value={collector.notes}
          aria-invalid={!!errors.notes?.length}
          aria-describedby={errors.notes?.length ? notesErrorId : undefined}
          onChange={(e) => change('notes', e.target.value)}
          className="mt-3 block h-38 w-1/2 resize-y rounded-xs border border-border bg-transparent p-3 text-sm mobile:w-full mobile:rounded-lg"
        />
        {errors.notes?.[0] && (
          <span
            id={notesErrorId}
            className="mt-2 block text-xs text-destructive"
          >
            {errors.notes[0]}
          </span>
        )}
      </label>
    </>
  )
}
