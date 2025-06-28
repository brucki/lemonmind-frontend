import * as React from 'react';
import { cn } from '@/lib/utils';

const AvatarContext = React.createContext<{
  isLoaded: boolean;
  setLoaded: (loaded: boolean) => void;
} | null>(null);

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    shape?: 'circle' | 'square' | 'rounded';
  }
>(({ className, size = 'md', shape = 'circle', ...props }, ref) => {
  const [isLoaded, setLoaded] = React.useState(false);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-24 w-24',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-md',
  };

  return (
    <AvatarContext.Provider value={{ isLoaded, setLoaded }}>
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden bg-muted',
          sizeClasses[size],
          shapeClasses[shape],
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  );
});
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, onLoad, ...props }, ref) => {
  const context = React.useContext(AvatarContext);
  
  React.useEffect(() => {
    if (context) {
      context.setLoaded(true);
    }
  }, [context]);

  return (
    <img
      ref={ref}
      className={cn(
        'h-full w-full object-cover',
        className
      )}
      onLoad={(e) => {
        if (onLoad) onLoad(e);
        if (context) context.setLoaded(true);
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    delayMs?: number;
  }
>(({ className, delayMs = 0, children, ...props }, ref) => {
  const context = React.useContext(AvatarContext);
  const [canRender, setCanRender] = React.useState(delayMs === 0);
  
  React.useEffect(() => {
    if (delayMs === 0) return;
    
    const timer = setTimeout(() => {
      setCanRender(true);
    }, delayMs);
    
    return () => clearTimeout(timer);
  }, [delayMs]);
  
  if (!context || (context.isLoaded && canRender)) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
AvatarFallback.displayName = 'AvatarFallback';

const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    max?: number;
    spacing?: number;
  }
>(({ className, children, max = 5, spacing = -4, ...props }, ref) => {
  const avatars = React.Children.toArray(children);
  const shouldShowMore = avatars.length > max;
  const visibleAvatars = shouldShowMore ? avatars.slice(0, max - 1) : avatars;
  const moreCount = avatars.length - (max - 1);
  
  return (
    <div
      ref={ref}
      className={cn('flex items-center', className)}
      {...props}
    >
      <div className="flex">
        {visibleAvatars.map((child, index) => (
          <div 
            key={index} 
            className="border-2 border-background rounded-full"
            style={{ marginLeft: index > 0 ? `${spacing}px` : 0 }}
          >
            {child}
          </div>
        ))}
        {shouldShowMore && (
          <div 
            className="flex items-center justify-center border-2 border-background rounded-full bg-muted text-xs font-medium"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              marginLeft: `${spacing}px`,
            }}
          >
            +{moreCount}
          </div>
        )}
      </div>
    </div>
  );
});
AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };

// Example usage:
/*
// Basic usage
<Avatar>
  <AvatarImage src="/user.jpg" alt="User" />
  <AvatarFallback>U</AvatarFallback>
</Avatar>

// With different size and shape
<Avatar size="lg" shape="rounded">
  <AvatarImage src="/user.jpg" alt="User" />
  <AvatarFallback>U</AvatarFallback>
</Avatar>

// Avatar group
<AvatarGroup max={3}>
  <Avatar>
    <AvatarImage src="/user1.jpg" alt="User 1" />
    <AvatarFallback>U1</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/user2.jpg" alt="User 2" />
    <AvatarFallback>U2</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/user3.jpg" alt="User 3" />
    <AvatarFallback>U3</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/user4.jpg" alt="User 4" />
    <AvatarFallback>U4</AvatarFallback>
  </Avatar>
</AvatarGroup>
*/
