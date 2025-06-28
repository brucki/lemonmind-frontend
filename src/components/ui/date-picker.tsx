import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
  showTimeSelect?: boolean;
  timeIntervals?: number;
  timeCaption?: string;
  dateFormat?: string;
  timeFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  filterDate?: (date: Date) => boolean;
  inline?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  id?: string;
  name?: string;
  readOnly?: boolean;
  withPortal?: boolean;
  popperPlacement?: 'top' | 'bottom' | 'left' | 'right';
  popperClassName?: string;
  wrapperClassName?: string;
  customInput?: React.ReactNode;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  dropdownMode?: 'scroll' | 'select';
  yearDropdownItemNumber?: number;
  scrollableYearDropdown?: boolean;
  yearItemNumber?: number;
  showTimeSelectOnly?: boolean;
  timeIntervals?: number;
  timeCaption?: string;
  timeFormat?: string;
  timeInputLabel?: string;
  injectTimes?: Date[];
  excludeTimes?: Date[];
  filterTime?: (time: Date) => boolean;
  showMonthYearPicker?: boolean;
  showQuarterYearPicker?: boolean;
  showWeekNumbers?: boolean;
  showWeekPicker?: boolean;
  weekLabel?: string;
  useWeekdaysShort?: boolean;
  useShortMonthInDropdown?: boolean;
  adjustDateOnChange?: boolean;
  disabledKeyboardNavigation?: boolean;
  renderCustomHeader?: ({
    date: Date,
    changeYear: (year: number) => void,
    changeMonth: (month: number) => void,
    decreaseMonth: () => void,
    increaseMonth: () => void,
    prevMonthButtonDisabled: boolean,
    nextMonthButtonDisabled: boolean,
    decreaseYear: () => void,
    increaseYear: () => void,
    prevYearButtonDisabled: boolean,
    nextYearButtonDisabled: boolean,
  }) => React.ReactNode;
  renderDayContents?: (day: number, date: Date) => React.ReactNode;
  renderMonthContent?: (month: number, shortMonth: string, longMonth: string) => React.ReactNode;
  renderQuarterContent?: (quarter: number) => React.ReactNode;
  renderYearContent?: (year: number) => React.ReactNode;
  onYearChange?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  onDayMouseEnter?: (date: Date) => void;
  onMonthMouseLeave?: () => void;
  onYearMouseEnter?: (date: Date) => void;
  onYearMouseLeave?: () => void;
  onInputClick?: () => void;
  onInputError?: (error: { code: number; msg: string }) => void;
  onCalendarOpen?: () => void;
  onCalendarClose?: () => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownArrowDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownArrowUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownEscape?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMark?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownBackspace?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownDelete?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownSpace?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownHome?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownEnd?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownPageUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownPageDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownArrowLeft?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownArrowRight?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownTab?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownShiftTab?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownUpArrow?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownDownArrow?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownLeftArrow?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownRightArrow?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownHomeEnd?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownPageUpDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownEscapeDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownEnterSpace?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkShift?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkAlt?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkCtrl?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkMeta?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkShiftCtrl?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkShiftMeta?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkCtrlMeta?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDownQuestionMarkShiftCtrlMeta?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  fromDate,
  toDate,
  showTimeSelect = false,
  timeIntervals = 30,
  timeCaption = 'Time',
  dateFormat = 'PPP',
  timeFormat = 'p',
  minDate,
  maxDate,
  filterDate,
  inline = false,
  label,
  required = false,
  error,
  id,
  name,
  readOnly = false,
  withPortal = false,
  popperPlacement = 'bottom-start',
  popperClassName,
  wrapperClassName,
  customInput,
  showYearDropdown = false,
  showMonthDropdown = false,
  dropdownMode = 'scroll',
  yearDropdownItemNumber = 15,
  scrollableYearDropdown = false,
  yearItemNumber = 12,
  showTimeSelectOnly = false,
  timeInputLabel = 'Time',
  injectTimes = [],
  excludeTimes = [],
  filterTime,
  showMonthYearPicker = false,
  showQuarterYearPicker = false,
  showWeekNumbers = false,
  showWeekPicker = false,
  weekLabel = 'Week',
  useWeekdaysShort = false,
  useShortMonthInDropdown = false,
  adjustDateOnChange = true,
  disabledKeyboardNavigation = false,
  renderCustomHeader,
  renderDayContents,
  renderMonthContent,
  renderQuarterContent,
  renderYearContent,
  onYearChange,
  onMonthChange,
  onDayMouseEnter,
  onMonthMouseLeave,
  onYearMouseEnter,
  onYearMouseLeave,
  onInputClick,
  onInputError,
  onCalendarOpen,
  onCalendarClose,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyDownArrowDown,
  onKeyDownArrowUp,
  onKeyDownEscape,
  onKeyDownEnter,
  onKeyDownQuestionMark,
  onKeyDownBackspace,
  onKeyDownDelete,
  onKeyDownSpace,
  onKeyDownHome,
  onKeyDownEnd,
  onKeyDownPageUp,
  onKeyDownPageDown,
  onKeyDownArrowLeft,
  onKeyDownArrowRight,
  onKeyDownTab,
  onKeyDownShiftTab,
  onKeyDownUpArrow,
  onKeyDownDownArrow,
  onKeyDownLeftArrow,
  onKeyDownRightArrow,
  onKeyDownHomeEnd,
  onKeyDownPageUpDown,
  onKeyDownEscapeDown,
  onKeyDownEnterSpace,
  onKeyDownQuestionMarkShift,
  onKeyDownQuestionMarkAlt,
  onKeyDownQuestionMarkCtrl,
  onKeyDownQuestionMarkMeta,
  onKeyDownQuestionMarkShiftCtrl,
  onKeyDownQuestionMarkShiftMeta,
  onKeyDownQuestionMarkCtrlMeta,
  onKeyDownQuestionMarkShiftCtrlMeta,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onChange?.(date);
    if (!showTimeSelect) {
      setOpen(false);
    }
  };

  const displayFormat = showTimeSelect 
    ? `${dateFormat} ${timeFormat}` 
    : dateFormat;

  return (
    <div className={cn('grid gap-1', wrapperClassName)}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {customInput || (
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground',
                className
              )}
              disabled={disabled}
              id={id}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              {...props}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, displayFormat)
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent 
          className={cn('w-auto p-0', popperClassName)} 
          align="start"
          side={popperPlacement}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={disabled}
            defaultMonth={selectedDate}
            fromDate={fromDate}
            toDate={toDate}
            toMonth={toDate}
            fromMonth={fromDate}
            month={selectedDate}
            onMonthChange={onMonthChange}
            onYearChange={onYearChange}
            numberOfMonths={1}
            showOutsideDays
            initialFocus
            captionLayout="dropdown"
            className="rounded-md border"
            classNames={{
              day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'text-muted-foreground opacity-50',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'bg-accent text-accent-foreground',
              button: 'hover:bg-accent hover:text-accent-foreground',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              dropdown: 'bg-background border rounded px-1 py-0.5',
              dropdown_year: 'mr-1',
              dropdown_month: 'mr-1',
              vhidden: 'hidden',
            }}
          />
          
          {showTimeSelect && selectedDate && (
            <div className="flex items-center justify-center border-t p-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Hour:</span>
                  <select
                    className="rounded border p-1 text-sm"
                    value={selectedDate.getHours()}
                    onChange={(e) => {
                      const newDate = new Date(selectedDate);
                      newDate.setHours(parseInt(e.target.value));
                      handleSelect(newDate);
                    }}
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Minute:</span>
                  <select
                    className="rounded border p-1 text-sm"
                    value={selectedDate.getMinutes()}
                    onChange={(e) => {
                      const newDate = new Date(selectedDate);
                      newDate.setMinutes(parseInt(e.target.value));
                      handleSelect(newDate);
                    }}
                  >
                    {Array.from({ length: 60 / timeIntervals }).map((_, i) => (
                      <option key={i} value={i * timeIntervals}>
                        {(i * timeIntervals).toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleSelect(undefined);
                setOpen(false);
              }}
              className="h-8 px-2 text-xs"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
              className="ml-2 h-8 px-3 text-xs"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

export { DatePicker };
