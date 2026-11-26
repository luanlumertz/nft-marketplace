import { Button } from '@/components/ui/button'
import CatalogDialog from './catalog-dialog'
import CatalogFilters from './catalog-filters'
import type { CatalogFilterProps } from './catalog-filter-types'

export default function CatalogFilterDialog({
  onClose,
  returnFocus,
  ...props
}: CatalogFilterProps & { onClose: () => void; returnFocus: () => void }) {
  return (
    <CatalogDialog
      title="Filtrar NFTs"
      description="Combine coleções, preço e rede."
      closeLabel="Fechar filtros"
      onClose={onClose}
      returnFocus={returnFocus}
      className="filter-drawer fixed right-0 top-0 h-dvh w-[min(420px,100%)] p-[30px_24px] overflow-y-auto overscroll-contain bg-background [border-left:1px_solid_var(--border)] z-81 [&_.catalog-filters]:p-0 [&_.catalog-filters]:[background:none] [&_.filter-sort]:flex [&_.filter-sort]:flex-col [&_.filter-sort]:gap-2.5 [&_.filter-sort]:text-[14px] [&_.filter-sort]:mt-6"
    >
      <CatalogFilters {...props} />
      <Button className="mt-6 w-full" onClick={onClose}>
        Ver resultados
      </Button>
    </CatalogDialog>
  )
}
