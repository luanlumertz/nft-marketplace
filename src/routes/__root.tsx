import { createRootRouteWithContext, Link } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/app-layout'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppLayout,
  notFoundComponent: () => (
    <section className="space-y-5 py-16">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">Esse endereço não está disponível.</p>
      <Link to="/" className="text-primary underline">Voltar ao início</Link>
    </section>
  ),
  errorComponent: ({ reset }) => (
    <section role="alert" className="space-y-5 py-16">
      <h1 className="text-2xl font-bold">Não foi possível abrir esta página.</h1>
      <button onClick={reset} className="text-primary underline">Tentar novamente</button>
    </section>
  ),
})
