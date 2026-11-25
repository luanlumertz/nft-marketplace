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
              'size-2 rounded-full border border-primary',
              active === index ? 'bg-primary' : 'bg-transparent',
            )}
          />
        </button>
      ))}
    </div>
  )
}
