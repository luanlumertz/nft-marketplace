import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/session'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { AccountShell } from './account-shell'
import { apiFailure } from './form-feedback'
import {
  walletNetworks,
  walletProviders,
  type Wallet,
  type WalletSlot,
} from './contracts'
import { useSaveWallet, walletsOptions } from './queries'
import { WalletForm } from './wallet-form'

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
  const [deleted, setDeleted] = useState(false)
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
                className="size-4 shrink-0 appearance-none rounded-full border border-primary bg-transparent checked:bg-primary disabled:opacity-60"
                checked={
                  (mirrorRequested && !mutation.isError) ||
                  (!!wallet?.sameAsPrimary && !editing)
                }
                disabled={!primary || pending}
                onChange={(event) => {
                  setSaved(false)
                  setDeleted(false)
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
              setDeleted(false)
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
            setDeleted(false)
          }}
          onDeleted={
            slot === 'secondary' && wallet
              ? () => {
                  setEditing(false)
                  setSaved(false)
                  setMirrorRequested(false)
                  setDeleted(true)
                }
              : undefined
          }
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
      {deleted && (
        <p role="status" className="mt-4 text-sm text-primary">
          Carteira secundária excluída.
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
  useDocumentTitle('Carteiras | Kurio')
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
