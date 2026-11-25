import { useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LogIn, LogOut, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSession } from './session'
import { useLogout } from './use-logout'

export function AccountButton({ mobile = false }: { mobile?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const session = useSession(),
    user = session.data?.user
  const href = useRouterState({ select: (state) => state.location.href }),
    [open, setOpen] = useState(false)
  const exit = useLogout(() => setOpen(false))
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
              <Link to="/perfil" onClick={() => setOpen(false)}>
                Dados do perfil
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/carteiras" onClick={() => setOpen(false)}>
                Carteiras
              </Link>
            </Button>
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
