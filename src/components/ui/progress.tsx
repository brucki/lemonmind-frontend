import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-secondary',
  {
    variants: {
      size: {
        default: 'h-2.5',
        sm: 'h-2',
        lg: 'h-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const progressIndicatorVariants = cva('h-full w-full flex-1 transition-all', {
  variants: {
    variant: {
      default: 'bg-primary',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorClassName?: string;
  showValue?: boolean;
  valueText?: string;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      indicatorClassName,
      value,
      showValue = false,
      valueText,
      label,
      variant = 'default',
      size = 'default',
      ...props
    },
    ref
  ) => {
    const progressValue = Math.min(100, Math.max(0, value || 0));
    const displayValue = valueText || `${progressValue}%`;

    return (
      <div className="w-full space-y-2">
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            )}
            {showValue && (
              <span className="text-sm text-muted-foreground">
                {displayValue}
              </span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          value={progressValue}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              progressIndicatorVariants({ variant }),
              indicatorClassName
            )}
            style={{ transform: `translateX(-${100 - progressValue}%)` }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

// Example usage:
/*
<Progress value={75} className="w-full" />
<Progress 
  value={42} 
  variant="success" 
  showValue 
  label="Storage used" 
  className="w-full" 
/>
<Progress 
  value={90} 
  variant="error" 
  size="lg" 
  valueText="High usage" 
  className="w-full" 
/>
*/
