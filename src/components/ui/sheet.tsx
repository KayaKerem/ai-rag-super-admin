import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0',
        className
      )}
      {...props}
    />
  )
}

type SheetSide = 'right' | 'left' | 'top' | 'bottom'

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: DialogPrimitive.Popup.Props & { side?: SheetSide }) {
  const sideClass: Record<SheetSide, string> = {
    right:
      'inset-y-0 right-0 h-full w-3/4 sm:max-w-md border-l data-open:slide-in-from-right data-closed:slide-out-to-right',
    left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-md border-r data-open:slide-in-from-left data-closed:slide-out-to-left',
    top: 'inset-x-0 top-0 h-1/3 border-b data-open:slide-in-from-top data-closed:slide-out-to-top',
    bottom:
      'inset-x-0 bottom-0 h-1/3 border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom',
  }
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 bg-background p-6 shadow-lg outline-none data-open:animate-in data-closed:animate-out',
          sideClass[side],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2"
          aria-label="Kapat"
        >
          <XIcon className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 mb-4', className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
