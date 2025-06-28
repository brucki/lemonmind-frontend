import * as React from 'react';
import { format, addDays, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

type Preset = {
  label: string;
  value: string;
  getDateRange: () => DateRange;
};

const defaultPresets: Preset[] = [
  {
    label: 'Today',
    value: 'today',
    getDateRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getDateRange: () => ({
      from: startOfDay(addDays(new Date(), -1)),
      to: endOfDay(addDays(new Date(), -1)),
    }),
  },
  {
    label: 'Last 7 days',
    value: 'last7',
    getDateRange: () => ({
      from: startOfDay(addDays(new Date(), -6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    value: 'last30',
    getDateRange: () => ({
      from: startOfDay(addDays(new Date(), -29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'This month',
    value: 'thisMonth',
    getDateRange: () => {
      const today = new Date();
      return {
        from: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      };
    },
  },
  {
    label: 'Last month',
    value: 'lastMonth',
    getDateRange: () => {
      const today = new Date();
      return {
        from: startOfDay(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        to: endOfDay(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    },
  },
  {
    label: 'This year',
    value: 'thisYear',
    getDateRange: () => ({
      from: startOfDay(new Date(new Date().getFullYear(), 0, 1)),
      to: endOfDay(new Date()),
    }),
  },
];

interface DateRangePickerProps {
  /**
   * The selected date range
   */
  dateRange: DateRange;
  /**
   * Callback when the date range changes
   */
  onDateRangeChange: (dateRange: DateRange) => void;
  /**
   * The date format to display
   * @default 'MMM d, yyyy'
   */
  displayFormat?: string;
  /**
   * The placeholder text when no date is selected
   * @default 'Pick a date range'
   */
  placeholder?: string;
  /**
   * Whether to show the preset dropdown
   * @default true
   */
  showPresets?: boolean;
  /**
   * The presets to show in the dropdown
   * @default defaultPresets
   */
  presets?: Preset[];
  /**
   * The label for the presets dropdown
   * @default 'Presets'
   */
  presetsLabel?: string;
  /**
   * Whether to disable the date range picker
   * @default false
   */
  disabled?: boolean;
  /**
   * The minimum date that can be selected
   */
  minDate?: Date;
  /**
   * The maximum date that can be selected
   */
  maxDate?: Date;
  /**
   * The number of months to show in the calendar
   * @default 2
   */
  numberOfMonths?: number;
  /**
   * Whether to show the clear button
   * @default true
   */
  showClearButton?: boolean;
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
  popoverClassName?: string;
  /**
   * The class name for the calendar
   */
  calendarClassName?: string;
  /**
   * The class name for the presets dropdown
   */
  presetsClassName?: string;
}

const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  (
    {
      dateRange = { from: undefined, to: undefined },
      onDateRangeChange,
      displayFormat = 'MMM d, yyyy',
      placeholder = 'Pick a date range',
      showPresets = true,
      presets = defaultPresets,
      presetsLabel = 'Presets',
      disabled = false,
      minDate,
      maxDate,
      numberOfMonths = 2,
      showClearButton = true,
      className,
      triggerClassName,
      popoverClassName,
      calendarClassName,
      presetsClassName,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [selectedPreset, setSelectedPreset] = React.useState<string>();

    // Update the selected preset when the date range changes
    React.useEffect(() => {
      if (!dateRange.from && !dateRange.to) {
        setSelectedPreset(undefined);
        return;
      }

      // Check if the current date range matches any preset
      for (const preset of presets) {
        const presetRange = preset.getDateRange();
        if (
          dateRange.from &&
          dateRange.to &&
          isSameDay(dateRange.from, presetRange.from) &&
          isSameDay(dateRange.to, presetRange.to || presetRange.from)
        ) {
          setSelectedPreset(preset.value);
          return;
        }
      }
      setSelectedPreset('custom');
    }, [dateRange, presets]);

    const handlePresetChange = (value: string) => {
      if (value === 'custom') {
        setSelectedPreset('custom');
        return;
      }

      const preset = presets.find((p) => p.value === value);
      if (preset) {
        onDateRangeChange(preset.getDateRange());
        setSelectedPreset(value);
      }
    };

    const handleSelect = (selectedDate: Date | undefined) => {
      if (!selectedDate) return;

      // If we have a from date and no to date, and the selected date is after from
      if (dateRange.from && !dateRange.to && selectedDate > dateRange.from) {
        onDateRangeChange({
          from: dateRange.from,
          to: endOfDay(selectedDate),
        });
      } else {
        // Otherwise, set the from date and clear the to date
        onDateRangeChange({
          from: startOfDay(selectedDate),
          to: undefined,
        });
      }
    };

    const clearSelection = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDateRangeChange({ from: undefined, to: undefined });
      setSelectedPreset(undefined);
    };

    const formatDateRange = () => {
      if (!dateRange.from) return placeholder;

      const from = format(dateRange.from, displayFormat);
      
      if (!dateRange.to) {
        return `${from} - `;
      }
      
      const to = format(dateRange.to, displayFormat);
      return `${from} - ${to}`;
    };

    return (
      <div className={cn('flex flex-col space-y-2', className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateRange.from && 'text-muted-foreground',
                triggerClassName
              )}
              {...props}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
              {showClearButton && dateRange.from && (
                <button
                  type="button"
                  className="ml-auto rounded-full p-0.5 hover:bg-accent hover:text-accent-foreground"
                  onClick={clearSelection}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn('w-auto p-0', popoverClassName)}
            align="start"
          >
            <div className="flex flex-col space-y-2 p-2">
              {showPresets && (
                <div className={cn('px-2 pt-2', presetsClassName)}>
                  <Select
                    value={selectedPreset}
                    onValueChange={handlePresetChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={presetsLabel} />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from) {
                    onDateRangeRange({
                      from: range.from,
                      to: range.to,
                    });
                  }
                }}
                className={cn('rounded-md border', calendarClassName)}
                classNames={{
                  months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                  month: 'space-y-4',
                  caption: 'flex justify-center pt-1 relative items-center',
                  caption_label: 'text-sm font-medium',
                  nav: 'space-x-1 flex items-center',
                  nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                  nav_button_previous: 'absolute left-1',
                  nav_button_next: 'absolute right-1',
                  table: 'w-full border-collapse space-y-1',
                  head_row: 'flex',
                  head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                  day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                  day_range_end: 'day-range-end',
                  day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                  day_today: 'bg-accent text-accent-foreground',
                  day_outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                  day_disabled: 'text-muted-foreground opacity-50',
                  day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                  day_hidden: 'invisible',
                }}
                components={{
                  IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                  IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                }}
                numberOfMonths={numberOfMonths}
                fromDate={minDate}
                toDate={maxDate}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';

export { DateRangePicker };

// Example usage:
/*
function Example() {
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  return (
    <div className="max-w-md space-y-4">
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showPresets
        className="w-full"
      />
      <div className="rounded-md border p-4">
        <h3 className="mb-2 text-lg font-medium">Selected Date Range:</h3>
        <pre className="rounded bg-muted p-2 text-sm">
          {JSON.stringify(
            {
              from: dateRange.from?.toISOString(),
              to: dateRange.to?.toISOString(),
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
*/
