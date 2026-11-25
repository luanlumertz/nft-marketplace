import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  Home,
  Heart,
  ScanLine,
  ShoppingCart,
  UserRound,
  LogIn,
} from 'lucide-react'
import { useCatalogEvents } from '@/features/nfts/use-catalog-events'
import { HeaderSearch } from '@/features/nfts/components/catalog-controls'
import { SiteFooter } from './site-footer'

export function AppLayout() {
  const announcement = useCatalogEvents()
  const home = useRouterState({
    select: (state) => state.location.pathname === '/',
  })

  return (
    <div
      className={`app-shell min-h-[100svh] ${home ? 'home-layout mobile:[&_.site-main]:pt-10' : ''}`}
    >
      <a
        href="#conteudo"
        className="skip-link fixed top-3 left-3 z-50 -translate-y-24 rounded bg-primary px-4 py-3 text-primary-foreground focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <header className="site-header h-[69px] grid grid-cols-[1fr_auto_1fr] items-center [border-bottom:1px_solid_var(--border)] mobile:hidden site-container w-[calc(100%_-_48px)] max-w-300 mx-auto">
        <Link
          to="/"
          aria-label="Kurio — início"
          className="site-logo text-[14px] font-bold tracking-[1.4px]"
        >
          KURIO
        </Link>
        <nav
          aria-label="Navegação principal"
          className="desktop-navigation flex gap-10 h-full items-center text-[16px] tracking-[0.4px] [&_a]:flex [&_a]:h-full [&_a]:items-center [&_a]:[border-bottom:3px_solid_transparent] [&_.active]:text-primary [&_.active]:border-b-primary [&_.active]:font-semibold tablet:gap-[18px] tablet:text-[14px]"
        >
          <Link
            to="/"
            activeProps={{ className: '' }}
            className={home ? 'active' : ''}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            activeProps={{ className: '' }}
            className={!home ? 'active' : ''}
          >
            Mercado
          </Link>
          <span aria-disabled="true" title="Indisponível nesta demonstração">
            Criadores
          </span>
          <a href={home ? '#diario-titulo' : '/#diario-titulo'}>Aprenda</a>
        </nav>
        <div className="header-actions flex justify-end items-center gap-[22px] tablet:gap-3">
          <HeaderSearch />
          <button
            className="icon-control w-7 h-10 grid place-items-center"
            disabled
            aria-label="Carrinho indisponível nesta demonstração"
          >
            <ShoppingCart />
          </button>
          <button
            className="account-trigger flex items-center gap-[6px] rounded-[6px] [padding:7px_10px] bg-primary text-background text-[16px] font-medium"
            disabled
            title="Acesso à conta indisponível nesta demonstração"
          >
            <LogIn size={19} />
            Entrar
          </button>
        </div>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className="site-main pt-8 pb-24 mobile:pt-6 mobile:pb-30 site-container w-[calc(100%_-_48px)] max-w-300 mx-auto"
      >
        <Outlet />
      </main>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <SiteFooter />
      <nav
        className="mobile-navigation hidden mobile:fixed mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:h-[95px] mobile:[padding:24px_24px_max(18px,_env(safe-area-inset-bottom))] mobile:rounded-[32px_32px_0_0] mobile:bg-card mobile:flex mobile:items-center mobile:justify-around mobile:text-muted-foreground mobile:z-40 mobile:[&_>_a]:grid mobile:[&_>_a]:place-items-center mobile:[&_>_a]:min-w-11 mobile:[&_>_a]:min-h-11 mobile:[&_>_button]:grid mobile:[&_>_button]:place-items-center mobile:[&_>_button]:min-w-11 mobile:[&_>_button]:min-h-11 mobile:[&_[aria-current='page']]:text-primary mobile:[&_.mobile-explore]:relative mobile:[&_.mobile-explore]:top-[-40px] mobile:[&_.mobile-explore]:w-16 mobile:[&_.mobile-explore]:h-16 mobile:[&_.mobile-explore]:rounded-[50%] mobile:[&_.mobile-explore]:[border:8px_solid_#21150eee] mobile:[&_.mobile-explore]:[background:linear-gradient(110deg,_#f2c28a,_#b77538)] mobile:[&_.mobile-explore]:text-foreground mobile:[&_.mobile-explore]:[box-shadow:0_8px_0_#1b110b]"
        aria-label="Navegação mobile"
      >
        <Link
          to="/"
          aria-label="Início"
          aria-current={home ? 'page' : undefined}
        >
          <Home size={20} />
        </Link>
        <button
          disabled
          aria-label="Favoritos indisponíveis nesta demonstração"
        >
          <Heart size={22} fill="currentColor" />
        </button>
        <a
          href={home ? '#catalogo' : '/#catalogo'}
          className="mobile-explore"
          aria-label="Explorar NFTs"
        >
          <ScanLine size={28} />
        </a>
        <button disabled aria-label="Carrinho indisponível nesta demonstração">
          <ShoppingCart size={22} />
        </button>
        <button disabled aria-label="Perfil indisponível nesta demonstração">
          <UserRound size={21} />
        </button>
      </nav>
    </div>
  )
}
