import { useId, useState } from 'react'
import { Search } from 'lucide-react'
export function CatalogSearchForm({
  value,
  onSearch,
  autoFocus = false,
}: {
  value: string
  onSearch: (q: string) => void
  autoFocus?: boolean
}) {
  const [draft, setDraft] = useState(value)
  const id = useId()
  return (
    <form
      role="search"
      className="catalog-search flex items-center gap-2.5 min-w-0 p-[10px_14px] bg-card rounded-lg text-muted-foreground [&_input]:bg-transparent [&_input]:w-full [&_input]:min-w-0 [&_input]:text-[14px] [&_input]:text-foreground [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft)
      }}
    >
      <Search size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>
        Buscar NFTs
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Explorar coleções"
        value={draft}
        maxLength={120}
        autoFocus={autoFocus}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        type="submit"
        aria-label="Pesquisar NFTs"
        className="search-submit text-primary text-[12px]"
      >
        Buscar
      </button>
    </form>
  )
}
