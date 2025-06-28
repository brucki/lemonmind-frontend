import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-8',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        info: 'bg-blue-50 text-blue-900 border-blue-200 [&>svg]:text-blue-600',
        success: 'bg-green-50 text-green-900 border-green-200 [&>svg]:text-green-600',
        warning: 'bg-yellow-50 text-yellow-900 border-yellow-200 [&>svg]:text-yellow-600',
        error: 'bg-red-50 text-red-900 border-red-200 [&>svg]:text-red-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
    dismissible?: boolean;
    onDismiss?: () => void;
  }
>(({ className, variant, dismissible = false, onDismiss, children, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {variant === 'info' && <Info className="h-5 w-5" />}
      {variant === 'success' && <CheckCircle2 className="h-5 w-5" />}
      {variant === 'warning' && <AlertTriangle className="h-5 w-5" />}
      {variant === 'error' && <AlertCircle className="h-5 w-5" />}
      {dismissible && (
        <button
          type="button"
          className="absolute right-3 top-3 rounded-md p-0.5 text-foreground/50 hover:bg-foreground/5 hover:text-foreground/75"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };

// Example usage:
/*
<Alert variant="info">
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>
*/
