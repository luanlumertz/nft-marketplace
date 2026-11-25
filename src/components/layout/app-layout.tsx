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
    <div className={`app-shell ${home ? 'home-layout' : ''}`}>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="site-header site-container">
        <Link to="/" aria-label="Kurio — início" className="site-logo">
          KURIO
        </Link>
        <nav aria-label="Navegação principal" className="desktop-navigation">
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
        <div className="header-actions">
          <HeaderSearch />
          <button
            className="icon-control"
            disabled
            aria-label="Carrinho indisponível nesta demonstração"
          >
            <ShoppingCart />
          </button>
          <button
            className="account-trigger"
            disabled
            title="Acesso à conta indisponível nesta demonstração"
          >
            <LogIn size={19} />
            Entrar
          </button>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="site-main site-container">
        <Outlet />
      </main>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <SiteFooter />
      <nav className="mobile-navigation" aria-label="Navegação mobile">
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
