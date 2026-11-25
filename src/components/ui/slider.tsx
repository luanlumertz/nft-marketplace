// Adaptado do registro shadcn/ui new-york-v4/slider, preservando geometria e foco.
import { useMemo, type ComponentProps } from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root> & { thumbLabels?: string[] }) {
  const values = useMemo(
    () => value ?? defaultValue ?? [min, max],
    [value, defaultValue, min, max],
  )
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(className)}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="price-track relative flex-1 h-0.75 rounded-2xs bg-border"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="price-range absolute h-full rounded-[inherit] bg-primary"
        />
      </SliderPrimitive.Track>
      {values.map((current, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          aria-label={thumbLabels?.[index]}
          // Compensa o recuo do Radix sem reduzir a área de interação de 24 px.
          style={
            value
              ? {
                  transform: `translateX(${((max > min ? (current - min) / (max - min) : 0) - 0.5) * 100}%)`,
                }
              : undefined
          }
          className="price-thumb grid place-items-center w-6 h-6 rounded-[50%] cursor-pointer before:content-[''] before:w-3.5 before:h-3.5 before:rounded-[50%] before:bg-primary hover:[outline:2px_solid_var(--foreground)] hover:outline-offset-[3px] focus-visible:[outline:2px_solid_var(--foreground)] focus-visible:outline-offset-[3px]"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
export { Slider }
