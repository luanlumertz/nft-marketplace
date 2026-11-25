import type { ReactNode } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className={className}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocus()
        }}
      >
        <DialogTitle className="mb-2 text-xl font-semibold">
          {title}
        </DialogTitle>
        <DialogDescription className="mb-5 text-sm text-muted-foreground">
          {description}
        </DialogDescription>
        {children}
        <DialogClose
          className="dialog-close absolute right-3 top-3 p-2 text-primary"
          aria-label={closeLabel}
        >
          <X size={20} />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
