import { Link, Outlet } from '@tanstack/react-router'
import { useCatalogEvents } from '@/features/nfts/use-catalog-events'

export function AppLayout() {
  const announcement = useCatalogEvents()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 sm:px-10">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <header className="flex h-20 items-center justify-between border-b border-border">
        <Link to="/" aria-label="Kurio — início" className="text-lg font-bold tracking-widest">KURIO</Link>
        <nav aria-label="Navegação principal">
          <Link to="/" className="text-sm text-primary underline-offset-8 hover:underline">Início</Link>
        </nav>
      </header>
      <main id="conteudo" tabIndex={-1} className="flex-1 py-10 sm:py-14">
        <Outlet />
      </main>
      <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2026 Kurio. Arte digital para colecionar.
      </footer>
    </div>
  )
}
