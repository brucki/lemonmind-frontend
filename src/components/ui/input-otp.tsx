import * as React from 'react';
import { cn } from '@/lib/utils';

const InputOTP = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onChange?: (value: string) => void;
    maxLength?: number;
    render?: (props: { value: string; index: number }) => React.ReactNode;
    containerClassName?: string;
    inputClassName?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    inputMode?: 'numeric' | 'text';
    pattern?: string;
    type?: 'text' | 'password' | 'tel';
  }
>(
  (
    {
      className,
      value = '',
      onChange,
      maxLength = 6,
      render,
      containerClassName,
      inputClassName,
      disabled = false,
      autoFocus = false,
      inputMode = 'numeric',
      pattern = '[0-9]*',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const newValue = e.target.value.trim();
      
      // If backspace is pressed, move to previous input
      if (e.target.value === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
        return;
      }
      
      // If input is not empty and not the last input, move to next input
      if (newValue && index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      
      // Update the value
      const newValues = value.split('');
      newValues[index] = newValue[newValue.length - 1] || '';
      onChange?.(newValues.join('').slice(0, maxLength));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < maxLength - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').trim();
      
      if (/^\d+$/.test(pastedData)) {
        const activeInput = focusedIndex ?? 0;
        const newValues = value.split('');
        
        pastedData.split('').forEach((char, i) => {
          const targetIndex = activeInput + i;
          if (targetIndex < maxLength) {
            newValues[targetIndex] = char;
          }
        });
        
        const newValue = newValues.join('').slice(0, maxLength);
        onChange?.(newValue);
        
        // Move focus to the next empty input or the last input
        const nextFocusIndex = Math.min(activeInput + pastedData.length, maxLength - 1);
        inputRefs.current[nextFocusIndex]?.focus();
      }
    };

    // Auto-focus the first input if empty or the next empty input
    React.useEffect(() => {
      if (autoFocus) {
        const firstEmptyIndex = value.split('').findIndex(char => !char);
        const indexToFocus = firstEmptyIndex === -1 ? maxLength - 1 : firstEmptyIndex;
        inputRefs.current[indexToFocus]?.focus();
      }
    }, [autoFocus, maxLength, value]);

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', containerClassName)}
        {...props}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <div key={i} className="relative">
            {render ? (
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-md border border-input text-center text-xl font-medium',
                focusedIndex === i && 'ring-2 ring-ring ring-offset-2',
                disabled && 'opacity-50 cursor-not-allowed',
                className
              )}>
                {render({ value: value[i] || '', index: i })}
              </div>
            ) : (
              <input
                ref={el => inputRefs.current[i] = el}
                type={type}
                inputMode={inputMode}
                pattern={pattern}
                maxLength={1}
                value={value[i] || ''}
                onChange={e => handleChange(e, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                onPaste={handlePaste}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                disabled={disabled}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-md border border-input bg-background text-center text-xl font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  inputClassName
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  }
);
InputOTP.displayName = 'InputOTP';

export { InputOTP };

// Example usage:
/*
function OTPForm() {
  const [otp, setOtp] = React.useState('');
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Enter Verification Code</h2>
        <p className="text-muted-foreground">We've sent a code to your email</p>
      </div>
      
      <div className="flex justify-center">
        <InputOTP
          value={otp}
          onChange={setOtp}
          maxLength={6}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          inputClassName="text-2xl"
        />
      </div>
      
      <Button 
        className="w-full" 
        disabled={otp.length !== 6}
        onClick={() => console.log('Verify OTP:', otp)}
      >
        Verify
      </Button>
      
      <div className="text-center text-sm text-muted-foreground">
        Didn't receive a code?{' '}
        <button 
          type="button" 
          className="text-primary font-medium hover:underline"
          onClick={() => console.log('Resend code')}
        >
          Resend
        </button>
      </div>
    </div>
  );
}
*/
