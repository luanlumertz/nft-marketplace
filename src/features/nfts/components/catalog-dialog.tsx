import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'

export default function CatalogDialog({
  title,
  description,
  closeLabel,
  className,
  onClose,
  returnFocus,
  children,
}: {
  title: string
  description: string
  closeLabel: string
  className: string
  onClose: () => void
  returnFocus: () => void
  children: ReactNode
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={className}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocus()
          }}
        >
          <Dialog.Title className="mb-2 text-xl font-semibold">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mb-5 text-sm text-muted-foreground">
            {description}
          </Dialog.Description>
          {children}
          <Dialog.Close className="dialog-close" aria-label={closeLabel}>
            <X size={20} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
