import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImageIcon, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/session'
import { AccountShell } from './account-shell'
import { apiFailure, validationErrors, type FieldErrors } from './form-feedback'
import { AccountField } from './account-field'
import {
  avatarMaxBytes,
  avatarSchema,
  profileUpdateSchema,
  type Profile,
} from './contracts'
import { profileOptions, useSaveProfile } from './queries'

function ProfileForm({ profile }: { profile: Profile }) {
  const [draft, setDraft] = useState(profile)
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [fields, setFields] = useState<FieldErrors>({}),
    [saved, setSaved] = useState(false),
    [avatarError, setAvatarError] = useState(''),
    [avatarLoading, setAvatarLoading] = useState(false)
  const form = useRef<HTMLFormElement>(null),
    upload = useRef<HTMLInputElement>(null),
    imageVersion = useRef(0)
  const { mutation, save } = useSaveProfile()
  const failure = apiFailure(mutation.error)
  const errors = { ...failure.fieldErrors, ...fields }
  useEffect(
    () => () => {
      imageVersion.current++
    },
    [],
  )
  function change<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setFields((previous) => ({ ...previous, [key]: undefined }))
    mutation.reset()
    setSaved(false)
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending || avatarError || avatarLoading) return
    const hasPassword = Object.values(passwords).some(Boolean)
    const parsed = profileUpdateSchema.safeParse({
      ...draft,
      ...(hasPassword ? { passwordChange: passwords } : {}),
    })
    if (!parsed.success) {
      setFields(validationErrors(parsed.error))
      setSaved(false)
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      )
      return
    }
    setFields({})
    setSaved(false)
    save(parsed.data, (updated) => {
      setDraft(updated)
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setSaved(true)
    })
  }
  async function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const version = ++imageVersion.current
    setAvatarError('')
    setSaved(false)
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > avatarMaxBytes
    ) {
      setAvatarError('Use uma imagem PNG, JPEG ou WebP de até 512 KB.')
      return
    }
    setAvatarLoading(true)
    try {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      if (version !== imageVersion.current) return
      const parsed = avatarSchema.safeParse(url)
      if (!parsed.success) throw new Error('invalid avatar')
      change('avatarUrl', parsed.data)
    } catch {
      if (version === imageVersion.current)
        setAvatarError(
          'Não foi possível abrir esta imagem. Escolha outro arquivo.',
        )
    } finally {
      if (version === imageVersion.current) setAvatarLoading(false)
    }
  }
  const field = (key: 'name' | 'username' | 'email' | 'walletAlias') => ({
    name: key,
    value: draft[key],
    error: errors[key]?.[0],
    onValueChange: (value: string) => change(key, value),
  })
  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      aria-label="Dados do perfil"
      className="mt-8"
    >
      <fieldset disabled={mutation.isPending || avatarLoading}>
        <div className="grid grid-cols-2 gap-x-7 gap-y-7 mobile:grid-cols-1 mobile:gap-5">
          <AccountField
            label="Nome de exibição"
            required
            maxLength={40}
            autoComplete="name"
            {...field('name')}
          />
          <AccountField
            label="Nome de usuário"
            required
            maxLength={30}
            autoComplete="username"
            {...field('username')}
          />
          <AccountField
            label="E-mail"
            required
            type="email"
            autoComplete="email"
            {...field('email')}
          />
          <AccountField
            label="Nome ENS"
            name="ensName"
            required
            ens
            value={draft.ensName.replace(/\.eth$/i, '')}
            onValueChange={(value) =>
              change('ensName', `${value.replace(/\.eth$/i, '')}.eth`)
            }
            error={errors.ensName?.[0]}
            maxLength={67}
          />
          <AccountField
            label="Apelido da carteira"
            required
            maxLength={40}
            {...field('walletAlias')}
          />
          <div>
            <p className="mb-2 text-[14px]">Avatar</p>
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid size-12.5 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-card text-primary">
                {draft.avatarUrl ? (
                  <img
                    src={draft.avatarUrl}
                    alt={`Avatar de ${draft.name}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon size={20} aria-hidden="true" />
                )}
              </div>
              <input
                ref={upload}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                tabIndex={-1}
                aria-label="Selecionar avatar"
                onChange={(event) => {
                  void selectAvatar(event)
                }}
              />
              <Button
                type="button"
                onClick={() => upload.current?.click()}
                className="h-10 rounded-xs px-6 font-semibold"
              >
                Alterar
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!draft.avatarUrl && !avatarError}
                onClick={() => {
                  imageVersion.current++
                  setAvatarError('')
                  change('avatarUrl', null)
                }}
                className="px-0"
              >
                Remover
              </Button>
            </div>
            {(avatarError || errors.avatarUrl?.[0]) && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {avatarError || errors.avatarUrl?.[0]}
              </p>
            )}
          </div>
        </div>
        <section
          className="mt-8 w-[calc((100%-28px)/2)] mobile:w-full"
          aria-labelledby="password-title"
        >
          <h2 id="password-title" className="mb-5 text-[16px] font-semibold">
            Alterar senha
          </h2>
          <div className="space-y-5">
            {(
              [
                ['currentPassword', 'Senha atual'],
                ['newPassword', 'Nova senha'],
                ['confirmPassword', 'Confirmar nova senha'],
              ] as const
            ).map(([key, label]) => (
              <AccountField
                key={key}
                name={key}
                label={label}
                password
                autoComplete={
                  key === 'currentPassword'
                    ? 'current-password'
                    : 'new-password'
                }
                maxLength={128}
                value={passwords[key]}
                error={errors[key]?.[0]}
                onValueChange={(value) => {
                  setPasswords((previous) => ({ ...previous, [key]: value }))
                  setFields((previous) => ({ ...previous, [key]: undefined }))
                  mutation.reset()
                  setSaved(false)
                }}
              />
            ))}
          </div>
        </section>
      </fieldset>
      {failure.message && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {failure.message}
        </p>
      )}
      {Object.values(fields).some((error) => error?.length) && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          Confira os campos destacados.
        </p>
      )}
      {saved && (
        <p role="status" className="mt-5 text-sm text-primary">
          Perfil salvo com sucesso.
        </p>
      )}
      <Button
        type="submit"
        disabled={mutation.isPending || avatarLoading || !!avatarError}
        className="mt-8 h-10 min-w-33 rounded-xs font-semibold mobile:h-12 mobile:w-full mobile:rounded-lg"
      >
        {mutation.isPending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Salvando…
          </>
        ) : (
          'Salvar'
        )}
      </Button>
    </form>
  )
}
export function ProfilePage() {
  const session = useSession(),
    user = session.data?.user
  const query = useQuery({
    ...profileOptions(user?.id ?? 'anonymous'),
    enabled: !!user,
  })
  useDocumentTitle('Perfil do colecionador | Kurio')
  return (
    <AccountShell active="profile">
      <h1 className="text-[16px] font-semibold mobile:text-[20px]">
        Perfil do colecionador
      </h1>
      {!user ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Entre para acessar seu perfil.
        </p>
      ) : query.isPending ? (
        <div
          role="status"
          aria-label="Carregando perfil"
          className="mt-8 grid grid-cols-2 gap-7 mobile:grid-cols-1"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-18" />
          ))}
        </div>
      ) : query.isError ? (
        <div role="alert" className="mt-8 text-sm">
          <p>Não foi possível carregar seu perfil.</p>
          <Button
            className="mt-4"
            onClick={() => {
              void query.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <ProfileForm key={query.data.id} profile={query.data} />
      )}
    </AccountShell>
  )
}
