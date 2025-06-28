import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

type Option = {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

interface MultiSelectProps {
  /**
   * The options to display in the select
   * @default []
   */
  options: Option[];
  /**
   * The selected values
   * @default []
   */
  value: string[];
  /**
   * Callback when the selected values change
   */
  onChange: (value: string[]) => void;
  /**
   * The placeholder text to display when no options are selected
   * @default "Select options..."
   */
  placeholder?: string;
  /**
   * The text to display when no options are available
   * @default "No options found."
   */
  emptyText?: string;
  /**
   * The text to display when searching
   * @default "Search..."
   */
  searchText?: string;
  /**
   * Whether the select is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the select is loading
   * @default false
   */
  loading?: boolean;
  /**
   * The loading text to display
   * @default "Loading..."
   */
  loadingText?: string;
  /**
   * Whether to show the clear button
   * @default true
   */
  showClearButton?: boolean;
  /**
   * Whether to show the search input
   * @default true
   */
  showSearch?: boolean;
  /**
   * Whether to close the dropdown after selecting an option
   * @default false
   */
  closeOnSelect?: boolean;
  /**
   * The maximum number of selected items to show before showing a count
   * @default 2
   */
  maxSelectedVisible?: number;
  /**
   * The variant of the select trigger
   * @default "outline"
   */
  variant?: 'outline' | 'ghost' | 'default';
  /**
   * The size of the select
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg';
  /**
   * The class name for the root element
   */
  className?: string;
  /**
   * The class name for the trigger button
   */
  triggerClassName?: string;
  /**
   * The class name for the popover content
   */
  contentClassName?: string;
  /**
   * The class name for the command
   */
  commandClassName?: string;
  /**
   * The class name for the command input
   */
  inputClassName?: string;
  /**
   * The class name for the command list
   */
  listClassName?: string;
  /**
   * The class name for the command empty
   */
  emptyClassName?: string;
  /**
   * The class name for the command group
   */
  groupClassName?: string;
  /**
   * The class name for the command item
   */
  itemClassName?: string;
  /**
   * The class name for the badge
   */
  badgeClassName?: string;
  /**
   * Whether to show the check icon
   * @default true
   */
  showCheckIcon?: boolean;
  /**
   * The check icon
   */
  checkIcon?: React.ReactNode;
  /**
   * The clear icon
   */
  clearIcon?: React.ReactNode;
  /**
   * The chevron icon
   */
  chevronIcon?: React.ReactNode;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options = [],
      value = [],
      onChange,
      placeholder = 'Select options...',
      emptyText = 'No options found.',
      searchText = 'Search...',
      disabled = false,
      loading = false,
      loadingText = 'Loading...',
      showClearButton = true,
      showSearch = true,
      closeOnSelect = false,
      maxSelectedVisible = 2,
      variant = 'outline',
      size = 'default',
      className,
      triggerClassName,
      contentClassName,
      commandClassName,
      inputClassName,
      listClassName,
      emptyClassName,
      groupClassName,
      itemClassName,
      badgeClassName,
      showCheckIcon = true,
      checkIcon = <Check className="h-4 w-4" />,
      clearIcon = <X className="h-4 w-4" />,
      chevronIcon = <ChevronsUpDown className="h-4 w-4 opacity-50" />,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const selectedValues = React.useMemo(
      () => new Set(value),
      [value]
    );

    const filteredOptions = React.useMemo(() => {
      if (!search) return options;
      const searchLower = search.toLowerCase();
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchLower) ||
          option.value.toLowerCase().includes(searchLower)
      );
    }, [options, search]);

    const selectedOptions = React.useMemo(
      () => options.filter((option) => selectedValues.has(option.value)),
      [options, selectedValues]
    );

    const toggleOption = (optionValue: string) => {
      const newSelectedValues = new Set(selectedValues);
      if (newSelectedValues.has(optionValue)) {
        newSelectedValues.delete(optionValue);
      } else {
        newSelectedValues.add(optionValue);
      }
      onChange(Array.from(newSelectedValues));
    };

    const clearSelection = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'Backspace' && !search && selectedValues.size > 0) {
        const lastSelected = Array.from(selectedValues).pop();
        if (lastSelected) {
          toggleOption(lastSelected);
        }
      }
    };

    const renderSelected = () => {
      if (selectedOptions.length === 0) {
        return <span className="text-muted-foreground">{placeholder}</span>;
      }

      const visibleOptions = selectedOptions.slice(0, maxSelectedVisible);
      const remainingCount = selectedOptions.length - visibleOptions.length;

      return (
        <div className="flex flex-wrap items-center gap-1">
          {visibleOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className={cn('flex items-center gap-1', badgeClassName)}
            >
              {option.icon && <option.icon className="h-3 w-3" />}
              {option.label}
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(option.value);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="outline" className={badgeClassName}>
              +{remainingCount} more
            </Badge>
          )}
        </div>
      );
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'h-auto min-h-9 w-full justify-between text-left font-normal',
              'data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-offset-2',
              className,
              triggerClassName
            )}
            onClick={() => {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            {...props}
          >
            <div className="flex-1 overflow-hidden">{renderSelected()}</div>
            <div className="ml-2 flex items-center">
              {showClearButton && selectedOptions.length > 0 && (
                <button
                  type="button"
                  className="mr-1 rounded-full p-0.5 hover:bg-accent hover:text-accent-foreground"
                  onClick={clearSelection}
                  disabled={disabled}
                >
                  {clearIcon}
                </button>
              )}
              {chevronIcon}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-full p-0', contentClassName)}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command
            className={cn('overflow-hidden', commandClassName)}
            onKeyDown={handleKeyDown}
          >
            {showSearch && (
              <div className="px-1 pt-1">
                <CommandInput
                  ref={inputRef}
                  placeholder={searchText}
                  value={search}
                  onValueChange={setSearch}
                  className={cn('h-9', inputClassName)}
                />
              </div>
            )}
            <CommandList className={listClassName}>
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {loadingText}
                </div>
              ) : filteredOptions.length === 0 ? (
                <CommandEmpty className={emptyClassName}>
                  {emptyText}
                </CommandEmpty>
              ) : (
                <CommandGroup className={groupClassName}>
                  {filteredOptions.map((option) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          toggleOption(option.value);
                          if (closeOnSelect) {
                            setOpen(false);
                          }
                        }}
                        disabled={option.disabled}
                        className={cn(
                          'cursor-pointer',
                          isSelected && 'bg-accent text-accent-foreground',
                          option.disabled && 'opacity-50',
                          itemClassName
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            {option.icon && (
                              <option.icon className="mr-2 h-4 w-4" />
                            )}
                            {option.label}
                          </div>
                          {showCheckIcon && isSelected && (
                            <span className="text-primary">
                              {checkIcon}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };

// Example usage:
/*
function Example() {
  const [selectedFrameworks, setSelectedFrameworks] = React.useState<string[]>([]);
  
  const frameworks = [
    { value: 'next', label: 'Next.js' },
    { value: 'svelte', label: 'SvelteKit' },
    { value: 'nuxt', label: 'Nuxt.js' },
    { value: 'remix', label: 'Remix' },
    { value: 'astro', label: 'Astro' },
    { value: 'gatsby', label: 'Gatsby' },
  ];

  return (
    <div className="max-w-md">
      <MultiSelect
        options={frameworks}
        value={selectedFrameworks}
        onChange={setSelectedFrameworks}
        placeholder="Select frameworks..."
        searchText="Search frameworks..."
        maxSelectedVisible={2}
      />
      <div className="mt-4">
        <pre className="rounded bg-muted p-4 text-sm">
          {JSON.stringify(selectedFrameworks, null, 2)}
        </pre>
      </div>
    </div>
  );
}
*/
