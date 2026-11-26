import { defaultParseSearch } from '@tanstack/react-router'

// Preserva preços decimais antes da conversão de números JSON para Number.
export function parseAppSearch(value: string): Record<string, unknown> {
  const parsed: Record<string, unknown> = { ...defaultParseSearch(value) }
  const raw = new URLSearchParams(value)
  for (const key of ['minPrice', 'maxPrice']) {
    const amount = raw.get(key)
    if (amount !== null && !amount.startsWith('"')) parsed[key] = amount
  }
  return parsed
}
