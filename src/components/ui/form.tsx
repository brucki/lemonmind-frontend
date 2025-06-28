import * as React from 'react';
import { useForm as useHookForm, FormProvider, useFormContext, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type z, type ZodType } from 'zod';

type FormProps<T extends ZodType> = {
  children: React.ReactNode;
  schema: T;
  onSubmit: SubmitHandler<z.infer<T>>;
  defaultValues?: Partial<z.infer<T>>;
  className?: string;
  resetOnSubmit?: boolean;
};

export function Form<T extends ZodType>({
  children,
  schema,
  onSubmit,
  defaultValues,
  className = '',
  resetOnSubmit = false,
}: FormProps<T>) {
  const methods = useHookForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onTouched',
  });

  const handleSubmit = methods.handleSubmit(async (data, e) => {
    try {
      await onSubmit(data, e);
      if (resetOnSubmit) {
        methods.reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
        {children}
      </form>
    </FormProvider>
  );
}

type FormFieldProps = {
  name: string;
  label?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  name,
  label,
  description,
  children,
  className = '',
}: FormFieldProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = errors[name];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      {children}
      {error?.message && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label?: string;
  description?: string;
  className?: string;
};

export function Input({
  name,
  label,
  description,
  className = '',
  ...props
}: InputProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} description={description}>
      <input
        id={name}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...register(name)}
        {...props}
      />
    </FormField>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label?: string;
  description?: string;
  className?: string;
};

export function Textarea({
  name,
  label,
  description,
  className = '',
  ...props
}: TextareaProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} description={description}>
      <textarea
        id={name}
        className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...register(name)}
        {...props}
      />
    </FormField>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  name: string;
  label?: string;
  description?: string;
  options: { value: string; label: string }[];
  className?: string;
};

export function Select({
  name,
  label,
  description,
  options,
  className = '',
  ...props
}: SelectProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} description={description}>
      <select
        id={name}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...register(name)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label?: string;
  description?: string;
  className?: string;
};

export function Checkbox({
  name,
  label,
  description,
  className = '',
  ...props
}: CheckboxProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} description={description}>
      <div className="flex items-center space-x-2">
        <input
          id={name}
          type="checkbox"
          className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
          {...register(name)}
          {...props}
        />
        {label && (
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
      </div>
    </FormField>
  );
}

type FormActionsProps = {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
};

export function FormActions({
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting = false,
  className = '',
}: FormActionsProps) {
  return (
    <div className={`flex justify-end space-x-3 pt-4 ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          disabled={isSubmitting}
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : submitLabel}
      </button>
    </div>
  );
}
