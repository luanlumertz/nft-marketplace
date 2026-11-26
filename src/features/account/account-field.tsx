import { useId, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SelectControl } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const inputStyle =
  'h-10 w-full min-w-0 rounded-xs border border-[#4b3020] bg-transparent px-3 text-[14px] text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent mobile:h-12 mobile:rounded-lg'
export function AccountField({
  label,
  error,
  options,
  ens = false,
  password = false,
  onValueChange,
  ...props
}: Omit<ComponentProps<typeof Input>, 'onChange'> & {
  label: string
  error?: string
  options?: readonly (readonly [string, string])[]
  ens?: boolean
  password?: boolean
  onValueChange?: (value: string) => void
}) {
  const id = useId(),
    [visible, setVisible] = useState(false)
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-3 block text-[14px] leading-5">
        {label}
        {props.required && (
          <span className="ml-1 text-primary" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className={`relative ${ens ? 'flex gap-2.5' : ''}`}>
        {ens && (
          <SelectControl
            aria-label="Domínio ENS"
            disabled={props.disabled}
            className={cn(inputStyle, 'w-20 shrink-0')}
            compact
            defaultValue=".eth"
            options={[['.eth', '.eth']]}
          />
        )}
        {options ? (
          <SelectControl
            id={id}
            name={props.name}
            value={props.value === undefined ? undefined : String(props.value)}
            disabled={props.disabled}
            required={props.required}
            onValueChange={onValueChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(inputStyle, !props.value && 'text-muted-foreground')}
            options={options}
            placeholder={props.placeholder}
          />
        ) : (
          <Input
            {...props}
            onChange={(event) => onValueChange?.(event.target.value)}
            id={id}
            type={password ? (visible ? 'text' : 'password') : props.type}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`${inputStyle} ${password ? 'pr-11' : ''}`}
          />
        )}
        {password && (
          <button
            type="button"
            disabled={props.disabled}
            aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
            className="absolute top-0 right-0 grid size-10 place-items-center text-muted-foreground mobile:top-1"
          >
            {visible ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
