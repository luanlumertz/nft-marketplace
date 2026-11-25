import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto-mono/latin-400.css'
import '@fontsource/roboto-mono/latin-500.css'
import '@fontsource/roboto-mono/latin-600.css'
import '@fontsource/roboto-mono/latin-700.css'
import { env } from '@/lib/env'
import './styles.css'

async function bootstrap() {
  if (env.mocksEnabled) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({
      quiet: true,
      onUnhandledRequest(request, print) {
        const url = new URL(request.url)
        if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) print.error()
      },
    })
  }

  // O cliente Socket.IO captura WebSocket ao importar. Carregue a app somente
  // depois que o MSW instalar os interceptors, inclusive no build otimizado.
  const { App } = await import('./app')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap().catch((error: unknown) => {
  console.error('Falha ao iniciar a aplicação:', error)
  const root = document.getElementById('root')
  if (root) {
    root.textContent = 'Não foi possível iniciar a aplicação. Recarregue a página para tentar novamente.'
    root.setAttribute('role', 'alert')
  }
})
