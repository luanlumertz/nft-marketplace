import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { AuthForm } from './auth-form'
import { safeReturnTo } from './contracts'
import { AuthBackground } from './auth-background'

export function AuthPage({
  mode,
  redirect,
  favorite,
  reason,
}: {
  mode: 'login' | 'register'
  redirect: string
  favorite?: string
  reason?: 'expired'
}) {
  const navigate = useNavigate(),
    registering = mode === 'register'
  const close = () => {
    void navigate({ href: safeReturnTo(redirect), replace: true })
  }
  return (
    <>
      <div className="mobile:hidden" aria-hidden="true">
        <AuthBackground redirect={redirect} />
      </div>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent
          overlayClassName="[background:transparent]"
          aria-describedby="auth-description"
          className="fixed top-[min(160px,16vh)] left-1/2 z-81 max-h-[calc(100dvh-20vh)] min-h-150 w-125 max-w-[calc(100%-48px)] -translate-x-1/2 overflow-y-auto border-b-10 border-primary bg-[#251610] px-12 pt-11 pb-16 mobile:inset-0 mobile:h-dvh mobile:max-h-none mobile:w-full mobile:max-w-none mobile:translate-x-0 mobile:rounded-none mobile:border-0 mobile:bg-background mobile:px-7 mobile:pt-32 mobile:pb-8"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            window.requestAnimationFrame(() => {
              if (!document.querySelector('[role="dialog"]'))
                document.getElementById('conteudo')?.focus()
            })
          }}
        >
          <DialogClose
            className="absolute top-3 right-3 p-2 text-primary"
            aria-label="Fechar e voltar"
          >
            <X size={18} />
          </DialogClose>
          <strong className="mb-18 hidden text-center text-[32px] font-bold tracking-[3px] mobile:block">
            KURIO
          </strong>
          <DialogTitle
            className={`sr-only mobile:not-sr-only mobile:mb-8 mobile:text-center mobile:font-semibold ${registering ? 'mobile:text-[18px]' : 'mobile:text-[20px]'}`}
          >
            {registering ? 'Criar perfil de colecionador' : 'Entrar'}
          </DialogTitle>
          <DialogDescription id="auth-description" className="sr-only">
            {registering
              ? 'Crie sua conta para salvar NFTs favoritos.'
              : 'Entre com seu e-mail e senha.'}
          </DialogDescription>
          <AuthForm
            key={mode}
            mode={mode}
            redirect={redirect}
            favorite={favorite}
            expired={reason === 'expired'}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
