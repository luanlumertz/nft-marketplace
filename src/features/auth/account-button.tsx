import { useRef, useState } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { LogIn, LogOut, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { logout, useSession } from './session'
import { catalogDefaults } from '@/features/nfts/catalog-search'

export function AccountButton({ mobile = false }: { mobile?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const session = useSession(),
    user = session.data?.user,
    router = useRouter()
  const href = useRouterState({ select: (state) => state.location.href }),
    [open, setOpen] = useState(false)
  const exit = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      setOpen(false)
      await router.navigate({ to: '/', search: catalogDefaults, replace: true })
    },
  })
  const style = mobile
    ? 'bg-transparent text-muted-foreground hover:bg-transparent'
    : 'account-trigger h-auto flex items-center gap-1.5 rounded-sm p-[7px_10px] has-[>svg]:px-2.5 bg-primary text-background text-[16px] font-medium'
  if (!user)
    return (
      <Button asChild variant={mobile ? 'ghost' : 'default'} className={style}>
        <Link
          to="/login"
          search={{ redirect: href }}
          aria-label={mobile ? 'Entrar na conta' : undefined}
        >
          <LogIn className={mobile ? 'size-5' : 'size-4.75'} />
          {!mobile && 'Entrar'}
        </Link>
      </Button>
    )
  return (
    <>
      <Button
        ref={trigger}
        variant={mobile ? 'ghost' : 'default'}
        className={style}
        onClick={() => setOpen(true)}
        aria-label={`Abrir conta de ${user.name}`}
      >
        <UserRound className="size-4.75" />
        {!mobile && <span className="max-w-28 truncate">{user.name}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="fixed top-1/2 left-1/2 z-81 w-[min(420px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-7"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            ;(trigger.current ?? document.getElementById('conteudo'))?.focus()
          }}
        >
          <DialogTitle className="pr-8 text-xl font-semibold">
            Olá, {user.name}
          </DialogTitle>
          <DialogDescription className="mt-2 break-all text-sm text-muted-foreground">
            {user.email}
          </DialogDescription>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link to="/favoritos" onClick={() => setOpen(false)}>
                Meus favoritos
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => exit.mutate()}
              disabled={exit.isPending}
            >
              <LogOut />
              {exit.isPending ? 'Saindo…' : 'Sair da conta'}
            </Button>
          </div>
          <DialogClose
            className="absolute top-3 right-3 p-2 text-primary"
            aria-label="Fechar conta"
          >
            <X size={18} />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
}
