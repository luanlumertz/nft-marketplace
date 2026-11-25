import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ComponentProps,
} from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { FaFacebookF } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { isAxiosError } from 'axios'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { http } from '@/lib/http'
import { queryClient } from '@/lib/query-client'
import { getSessionToken } from '@/lib/credentials'
import { loginSchema, registerSchema, safeReturnTo } from './contracts'
import { acceptAuthentication, favoriteKey } from './session'
import { favoritesSchema } from '@/features/favorites/favorites'

type Errors = Record<string, string[] | undefined>
function Field({
  label,
  error,
  password = false,
  ...props
}: ComponentProps<typeof Input> & {
  label: string
  error?: string
  password?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const id = `auth-${props.name}`
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={password ? (visible ? 'text' : 'password') : props.type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-10 rounded-xs border-[#65442c] bg-transparent px-4 text-[13px] text-foreground shadow-none placeholder:text-muted-foreground/85 focus-visible:border-primary focus-visible:ring-0 mobile:h-12.5 mobile:rounded-lg mobile:text-[14px]"
        />
        {password && (
          <button
            type="button"
            className="absolute top-0 right-1 grid size-10 place-items-center text-muted-foreground mobile:top-1"
            aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <Eye size={19} /> : <EyeOff size={19} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function AuthForm({
  mode,
  redirect,
  favorite,
  expired,
}: {
  mode: 'login' | 'register'
  redirect: string
  favorite?: string
  expired?: boolean
}) {
  const registering = mode === 'register',
    navigate = useNavigate()
  const [fields, setFields] = useState<Errors>({}),
    [failure, setFailure] = useState('')
  const active = useRef(true),
    controller = useRef<AbortController | null>(null)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      controller.current?.abort()
    }
  }, [])
  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const previousToken = getSessionToken()
      controller.current = new AbortController()
      const response = await http.post(
        `/session/${registering ? 'register' : 'login'}`,
        payload,
        { signal: controller.current.signal },
      )
      if (!active.current) return
      if (previousToken !== getSessionToken())
        throw new Error('A sessão mudou em outra aba. Tente novamente.')
      const authenticated = await acceptAuthentication(response.data)
      if (favorite) {
        try {
          const saved = favoritesSchema.parse(
            (
              await http.put(
                `/favorites/${encodeURIComponent(favorite)}`,
                undefined,
                { headers: { Authorization: `Bearer ${authenticated.token}` } },
              )
            ).data,
          )
          if (getSessionToken() === authenticated.token)
            queryClient.setQueryData(favoriteKey(authenticated.user.id), saved)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) throw error
          window.dispatchEvent(
            new CustomEvent('kurio:notice', {
              detail:
                'Você entrou, mas não foi possível favoritar o NFT. Tente novamente.',
            }),
          )
        }
      }
      if (active.current && getSessionToken() === authenticated.token)
        await navigate({ href: safeReturnTo(redirect), replace: true })
    },
    onError: (error) => {
      if (!active.current) return
      const data = isAxiosError(error) ? error.response?.data : undefined
      setFields(data?.fieldErrors ?? {})
      setFailure(
        data?.message ??
          (!isAxiosError(error) && error instanceof Error
            ? error.message
            : 'Não foi possível conectar. Tente novamente.'),
      )
    },
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending) return
    const raw = Object.fromEntries(new FormData(event.currentTarget))
    const parsed = (registering ? registerSchema : loginSchema).safeParse(raw)
    if (!parsed.success) {
      setFields(z.flattenError(parsed.error).fieldErrors)
      setFailure('Confira os campos destacados.')
      return
    }
    setFields({})
    setFailure('')
    mutation.mutate(parsed.data)
  }
  const search = { redirect: safeReturnTo(redirect), favorite }
  return (
    <div className="mx-auto w-85 max-w-full mobile:w-full">
      <div className="mb-9 flex justify-center text-[20px] font-semibold tracking-wide mobile:mb-8 mobile:hidden">
        <Link
          to="/login"
          search={search}
          className={registering ? '' : 'text-primary'}
          aria-current={!registering ? 'page' : undefined}
        >
          Entrar
        </Link>
        <span className="mx-2 text-primary" aria-hidden="true">
          |
        </span>
        <Link
          to="/cadastro"
          search={search}
          className={registering ? 'text-primary' : ''}
          aria-current={registering ? 'page' : undefined}
        >
          Criar conta
        </Link>
      </div>
      <p className="mb-6 text-center text-[13px] leading-4 mobile:hidden">
        {registering
          ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
          : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
      </p>
      {expired && (
        <p role="status" className="mb-4 text-sm text-primary">
          Sua sessão expirou. Entre novamente para continuar.
        </p>
      )}
      <form
        onSubmit={submit}
        noValidate
        className="space-y-3"
        aria-label={registering ? 'Criar conta' : 'Entrar na Kurio'}
      >
        {registering && (
          <Field
            label="Nome de usuário"
            name="name"
            placeholder="Nome de usuário"
            autoComplete="nickname"
            autoFocus
            maxLength={40}
            error={fields.name?.[0]}
          />
        )}
        <Field
          label="E-mail"
          name="email"
          type="email"
          placeholder={registering ? 'Digite seu e-mail' : 'contato@email.com'}
          autoComplete="email"
          autoFocus={!registering}
          maxLength={254}
          error={fields.email?.[0]}
        />
        <Field
          label="Senha"
          name="password"
          password
          placeholder="Senha"
          autoComplete={registering ? 'new-password' : 'current-password'}
          maxLength={128}
          error={fields.password?.[0]}
        />
        {registering && (
          <Field
            label="Confirmar senha"
            name="confirmPassword"
            password
            placeholder="Confirmar senha"
            autoComplete="new-password"
            maxLength={128}
            error={fields.confirmPassword?.[0]}
          />
        )}
        {!registering && (
          <div className="text-right">
            <button
              type="button"
              disabled
              title="Recuperação de senha indisponível nesta demonstração"
              className="text-[14px] text-primary"
            >
              Esqueceu a senha?
            </button>
          </div>
        )}
        {failure && (
          <p role="alert" className="text-sm text-destructive">
            {failure}
          </p>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="mt-3 h-11.5 w-full rounded-xs text-[16px] font-semibold mobile:mt-7 mobile:h-15 mobile:rounded-lg"
        >
          {mutation.isPending ? (
            <>
              <LoaderCircle className="animate-spin" />
              Aguarde…
            </>
          ) : registering ? (
            'Criar conta'
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-[12px] mobile:mt-10 mobile:mb-4">
        <span className="h-px flex-1 bg-border" />
        <span>Ou continue com</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3">
        <Button
          variant="outline"
          disabled
          className="h-10 w-full rounded-xs border-border bg-transparent text-[13px] text-muted-foreground disabled:opacity-100"
          title="Login com Google indisponível"
        >
          <FcGoogle className="size-5" />
          Continuar com Google
        </Button>
        <Button
          variant="outline"
          disabled
          className="h-10 w-full rounded-xs border-border bg-transparent text-[13px] text-muted-foreground disabled:opacity-100"
          title="Login com Facebook indisponível"
        >
          <FaFacebookF className="size-5 text-[#4267a9]" />
          Continuar com Facebook
        </Button>
      </div>
      <p className="mt-10 hidden text-center text-[14px] text-muted-foreground mobile:block">
        {registering ? 'Já tem uma conta? ' : 'Novo na Kurio? '}
        <Link
          to={registering ? '/login' : '/cadastro'}
          search={search}
          className="hover:text-primary hover:underline"
        >
          {registering ? 'Entre' : 'Crie uma conta'}
        </Link>
      </p>
    </div>
  )
}
