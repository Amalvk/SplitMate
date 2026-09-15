import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/utils/cn'
import { getAvatarColor, getInitials } from '@/utils/avatar'

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
))
AvatarRoot.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full object-cover', className)} {...props} />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-white', className)}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-16 w-16 text-lg',
} as const

interface AvatarProps {
  name: string
  src?: string
  size?: keyof typeof sizeClasses
  className?: string
  ring?: boolean
}

/** Convenience avatar: renders an image if provided, otherwise deterministic initials + color. */
function Avatar({ name, src, size = 'md', className, ring }: AvatarProps) {
  return (
    <AvatarRoot className={cn(sizeClasses[size], ring && 'ring-2 ring-background', className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback style={{ backgroundColor: getAvatarColor(name) }}>{getInitials(name)}</AvatarFallback>
    </AvatarRoot>
  )
}

export { Avatar, AvatarRoot, AvatarImage, AvatarFallback }
