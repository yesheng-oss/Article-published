import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          // Variants
          variant === 'default' &&
            'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          variant === 'outline' &&
            'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
          variant === 'ghost' &&
            'hover:bg-accent hover:text-accent-foreground',
          variant === 'destructive' &&
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
          // Sizes
          size === 'default' && 'h-9 px-4 py-2',
          size === 'sm' && 'h-8 rounded-md px-3 text-xs',
          size === 'lg' && 'h-11 rounded-md px-8',
          size === 'icon' && 'h-9 w-9',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
