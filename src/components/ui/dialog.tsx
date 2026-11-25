// Adaptado do registro shadcn/ui new-york-v4/dialog para a identidade da Kurio.
import type { ComponentProps } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
function DialogClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}
function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'dialog-overlay fixed inset-0 [background:#000b] z-80',
        className,
      )}
      {...props}
    />
  )
}
function DialogContent({
  children,
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(className)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(className)}
      {...props}
    />
  )
}
function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(className)}
      {...props}
    />
  )
}
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
}
