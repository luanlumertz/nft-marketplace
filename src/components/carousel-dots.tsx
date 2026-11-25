import { cn } from '@/lib/utils'

export function CarouselDots({
  count,
  active,
  onSelect,
  label,
  buttonLabel,
  className,
}: {
  count: number
  active: number
  onSelect: (index: number) => void
  label: string
  buttonLabel: string
  className?: string
}) {
  return (
    <div aria-label={label} className={cn('flex justify-center', className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          className="grid size-6 place-items-center"
          aria-label={`${buttonLabel} ${index + 1}`}
          aria-pressed={active === index}
          onClick={() => onSelect(index)}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full bg-primary opacity-45 transition-[width,border-radius,opacity] duration-150',
              active === index &&
                'w-5 rounded-md opacity-100 shadow-[0_0_0_2px_var(--background),0_0_0_3px_var(--primary)]',
            )}
          />
        </button>
      ))}
    </div>
  )
}
