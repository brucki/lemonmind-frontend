import * as React from 'react';
import { Search, Loader2, Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      className
    )}
    {...props}
  />
));
Command.displayName = 'Command';

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    isLoading?: boolean;
    clearable?: boolean;
    onClear?: () => void;
  }
>(({ className, isLoading, clearable, onClear, ...props }, ref) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      {isLoading && (
        <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
      )}
      {clearable && props.value && (
        <button
          type="button"
          onClick={handleClear}
          className="ml-2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});
CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-6 text-center text-sm text-muted-foreground', className)}
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    heading?: React.ReactNode;
  }
>(({ className, heading, children, ...props }, ref) => (
  <div ref={ref} className={cn('overflow-hidden p-1', className)} {...props}>
    {heading && (
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {heading}
      </div>
    )}
    <div className="[&_[cmdk-group]:px-2 [&_[cmdk-group]:py-1.5]">
      {children}
    </div>
  </div>
));
CommandGroup.displayName = 'CommandGroup';

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 h-px bg-border', className)}
    {...props}
  />
));
CommandSeparator.displayName = 'CommandSeparator';

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onSelect?: (value: string) => void;
    isSelected?: boolean;
    disabled?: boolean;
    shortcut?: string;
  }
>(
  (
    {
      className,
      value,
      onSelect,
      isSelected = false,
      disabled = false,
      shortcut,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          isSelected && 'bg-accent text-accent-foreground',
          disabled && 'pointer-events-none opacity-50',
          !disabled && 'hover:bg-accent hover:text-accent-foreground',
          className
        )}
        onSelect={() => {
          if (!disabled && onSelect && value) {
            onSelect(value);
          }
        }}
        data-disabled={disabled ? '' : undefined}
        aria-disabled={disabled}
        {...props}
      >
        <div className="flex flex-1 items-center">
          <Check
            className={cn(
              'mr-2 h-4 w-4',
              isSelected ? 'opacity-100' : 'opacity-0'
            )}
          />
          {children}
        </div>
        {shortcut && (
          <span className="ml-auto text-xs tracking-widest text-muted-foreground">
            {shortcut}
          </span>
        )}
      </div>
    );
  }
);
CommandItem.displayName = 'CommandItem';

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = 'CommandShortcut';

const CommandCombobox = ({
  options,
  value,
  onSelect,
  placeholder = "Search...",
  emptyText = "No results found.",
  loading = false,
  disabled = false,
  className,
  inputClassName,
  popoverClassName,
  groupClassName,
  itemClassName,
  renderOption,
  ...props
}: {
  options: Array<{
    value: string;
    label: string;
    group?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  popoverClassName?: string;
  groupClassName?: string;
  itemClassName?: string;
  renderOption?: (option: (typeof options)[0]) => React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, typeof options> = {};
    
    options.forEach((option) => {
      const group = option.group || '';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(option);
    });
    
    return groups;
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    
    const searchLower = search.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative w-full", className)} {...props}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          ref={inputRef}
          value={open ? search : selectedOption?.label || ''}
          onValueChange={setSearch}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn("h-10", inputClassName)}
          clearable={!!search}
          onClear={() => setSearch('')}
          onClick={() => !open && setOpen(true)}
          readOnly={!open}
          disabled={disabled}
        />
        
        {open && (
          <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
            <CommandList className={popoverClassName}>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOptions.length === 0 ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <CommandGroup
                    key={group || 'default'}
                    heading={group || 'Options'}
                    className={groupClassName}
                  >
                    {groupOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          onSelect(currentValue);
                          setOpen(false);
                          setSearch('');
                        }}
                        isSelected={value === option.value}
                        disabled={option.disabled}
                        className={itemClassName}
                      >
                        {option.icon && (
                          <span className="mr-2">{option.icon}</span>
                        )}
                        {renderOption ? renderOption(option) : option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </div>
        )}
      </Command>
      
      {open && (
        <div
          className="fixed inset-0 z-0"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  CommandCombobox,
};

// Example usage:
/*
const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "gatsby", label: "Gatsby" },
  { value: "svelte", label: "Svelte" },
  { value: "react", label: "React" },
  { value: "vue
