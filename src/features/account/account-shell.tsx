import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  BadgeDollarSign,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { useLogout } from '@/features/auth/use-logout'

export function AccountShell({
  active,
  children,
}: {
  active: 'profile' | 'wallets'
  children: ReactNode
}) {
  const exit = useLogout()
  const item =
    'flex min-h-11.25 items-center gap-4 border-l-6 border-transparent px-3 text-[14px] text-primary'
  const selected = 'border-l-primary bg-primary/5'
  return (
    <div className="grid grid-cols-[310px_minmax(0,1fr)] items-start gap-7 tablet:grid-cols-[220px_minmax(0,1fr)] tablet:gap-5 mobile:block">
      <aside
        aria-label="Navegação da conta"
        className="bg-[#251610] mobile:hidden"
      >
        <h2 className="px-2.5 pt-3.5 pb-1 text-[18px] font-semibold">
          Meu perfil
        </h2>
        <nav>
          <Link
            to="/perfil"
            aria-current={active === 'profile' ? 'page' : undefined}
            className={`${item} ${active === 'profile' ? selected : ''}`}
          >
            <UserRound size={17} />
            Dados do perfil
          </Link>
          <Link
            to="/carteiras"
            aria-current={active === 'wallets' ? 'page' : undefined}
            className={`${item} ${active === 'wallets' ? selected : ''}`}
          >
            <MapPin size={17} />
            Carteiras
          </Link>
          <span
            aria-disabled="true"
            title="Indisponível nesta demonstração"
            className={item}
          >
            <ShoppingCart size={17} />
            Atividade
          </span>
          <Link to="/favoritos" className={item}>
            <Heart size={17} />
            Lista de interesse
          </Link>
          <span
            aria-disabled="true"
            title="Indisponível nesta demonstração"
            className={item}
          >
            <BadgeDollarSign size={17} />
            Ofertas
          </span>
          <span
            aria-disabled="true"
            title="Indisponível nesta demonstração"
            className={item}
          >
            <Download size={17} />
            Arquivos baixados
          </span>
          <span
            aria-disabled="true"
            title="Indisponível nesta demonstração"
            className={item}
          >
            <TriangleAlert size={17} />
            Suporte
          </span>
          <button
            type="button"
            disabled={exit.isPending}
            onClick={() => exit.mutate()}
            className="mt-1 flex min-h-12 w-full items-center gap-4 border-t border-border px-4 font-semibold text-primary"
          >
            <LogOut size={18} />
            {exit.isPending ? 'Saindo…' : 'Sair'}
          </button>
        </nav>
      </aside>
      <div className="mb-7 hidden mobile:block">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft size={18} />
            Minha conta
          </Link>
          <button
            type="button"
            disabled={exit.isPending}
            onClick={() => exit.mutate()}
            aria-label="Sair da conta"
            className="grid size-10 place-items-center text-primary"
          >
            <LogOut size={20} />
          </button>
        </div>
        <nav
          aria-label="Seções da conta"
          className="flex gap-6 border-b border-border text-sm"
        >
          <Link
            to="/perfil"
            aria-current={active === 'profile' ? 'page' : undefined}
            className={`border-b-2 pb-3 ${active === 'profile' ? 'border-primary text-primary' : 'border-transparent'}`}
          >
            Dados do perfil
          </Link>
          <Link
            to="/carteiras"
            aria-current={active === 'wallets' ? 'page' : undefined}
            className={`border-b-2 pb-3 ${active === 'wallets' ? 'border-primary text-primary' : 'border-transparent'}`}
          >
            Carteiras
          </Link>
        </nav>
      </div>
      <section className="min-w-0">{children}</section>
    </div>
  )
}
