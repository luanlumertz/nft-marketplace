// Composição shadcn/ui sobre Radix Select, adaptada ao tema Kurio.
import type { ComponentProps } from 'react'
import { Select as SelectPrimitive } from 'radix-ui'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type SelectControlProps = Omit<
  ComponentProps<typeof SelectPrimitive.Trigger>,
  'value' | 'defaultValue' | 'onChange'
> & {
  name?: string
  required?: boolean
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: readonly (readonly [string, string])[]
  placeholder?: string
  compact?: boolean
}
export function SelectControl({
  name,
  required,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = 'Selecione',
  compact = false,
  className,
  disabled,
  ...props
}: SelectControlProps) {
  return (
    <SelectPrimitive.Root
      name={name}
      required={required}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        {...props}
        disabled={disabled}
        data-slot="select-trigger"
        className={cn(
          'relative flex h-10 w-full min-w-0 items-center rounded-xs border border-border bg-transparent px-3 text-sm text-foreground shadow-none outline-none focus-visible:border-primary focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60 data-placeholder:text-muted-foreground [&>span:first-child]:truncate',
          className,
          compact ? 'px-2 pr-8' : 'pr-10',
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground',
              compact ? 'right-2' : 'right-3',
            )}
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          data-slot="select-content"
          position="popper"
          sideOffset={4}
          collisionPadding={12}
          className="relative z-90 max-h-[min(320px,var(--radix-select-content-available-height))] min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-xl"
        >
          <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center text-primary">
            <ChevronUp aria-hidden="true" className="size-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {options.map(([key, label]) => (
              <SelectPrimitive.Item
                key={key}
                value={key}
                data-value={key}
                className="relative flex min-h-10 cursor-pointer items-center rounded-md py-2 pr-9 pl-3 text-sm outline-none select-none data-highlighted:bg-primary data-highlighted:text-primary-foreground"
              >
                <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 grid size-4 place-items-center">
                  <Check aria-hidden="true" className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center text-primary">
            <ChevronDown aria-hidden="true" className="size-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
