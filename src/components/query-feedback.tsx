import { Button } from '@/components/ui/button'

export function QueryError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-border bg-card p-6">
      <p className="font-semibold">Não foi possível carregar os NFTs.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Confira sua conexão e tente novamente.
      </p>
      <Button onClick={retry} className="mt-5">
        Tentar novamente
      </Button>
    </div>
  )
}
