import { Link, useRouterState } from '@tanstack/react-router'
import { LogIn, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from './session'

export function AccountButton({ mobile = false }: { mobile?: boolean }) {
  const user = useSession().data?.user
  const href = useRouterState({ select: (state) => state.location.href })
  const style = mobile
    ? 'bg-transparent text-muted-foreground hover:bg-transparent'
    : 'account-trigger h-auto flex items-center gap-1.5 rounded-sm p-[7px_10px] has-[>svg]:px-2.5 bg-primary text-background text-[16px] font-medium'
  return (
    <Button asChild variant={mobile ? 'ghost' : 'default'} className={style}>
      {user ? (
        <Link to="/perfil" aria-label={`Ir ao perfil de ${user.name}`}>
          <UserRound className="size-4.75" />
          {!mobile && <span className="max-w-28 truncate">{user.name}</span>}
        </Link>
      ) : (
        <Link
          to="/login"
          search={{ redirect: href }}
          aria-label={mobile ? 'Entrar na conta' : undefined}
        >
          <LogIn className={mobile ? 'size-5' : 'size-4.75'} />
          {!mobile && 'Entrar'}
        </Link>
      )}
    </Button>
  )
}
