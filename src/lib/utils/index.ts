import { z } from 'zod';
import { format, parseISO, isValid, isAfter, isBefore, addDays, subDays } from 'date-fns';
import { ProductFormData, CategoryFormData, InsertProduct, UpdateProduct } from '@/types/database.types';

// Form Validation Schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  price: z.number().min(0, 'Price must be positive').max(1000000, 'Price is too high'),
  compare_at_price: z.number().min(0, 'Compare at price must be positive').optional().nullable(),
  cost_per_item: z.number().min(0, 'Cost must be positive').optional().nullable(),
  sku: z.string().max(100, 'SKU is too long').optional(),
  barcode: z.string().max(100, 'Barcode is too long').optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative').default(0),
  track_quantity: z.boolean().default(true),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  weight: z.number().min(0, 'Weight must be positive').optional().nullable(),
  weight_unit: z.string().default('g'),
  category_ids: z.array(z.string().uuid()).default([])
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  is_active: z.boolean().default(true),
  parent_id: z.string().uuid().optional().nullable()
});

// Form Utilities
export const formatFormErrors = (errors: z.ZodIssue[]) => {
  return errors.reduce((acc, error) => {
    const key = error.path.join('.');
    return { ...acc, [key]: error.message };
  }, {} as Record<string, string>);
};

export const validateForm = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: boolean; errors?: Record<string, string>; data?: z.infer<T> } => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: formatFormErrors(result.error.issues)
    };
  }
  
  return { success: true, data: result.data };
};

// Data Transformation
export const transformProductFormData = (
  formData: ProductFormData
): Omit<InsertProduct, 'user_id'> => {
  return {
    name: formData.name,
    slug: formData.slug,
    description: formData.description || null,
    price: formData.price,
    compare_at_price: formData.compare_at_price || null,
    cost_per_item: formData.cost_per_item || null,
    sku: formData.sku || null,
    barcode: formData.barcode || null,
    quantity: formData.quantity,
    track_quantity: formData.track_quantity,
    is_active: formData.is_active,
    is_featured: formData.is_featured,
    weight: formData.weight || null,
    weight_unit: formData.weight_unit
  };
};

export const transformCategoryFormData = (
  formData: CategoryFormData
): Omit<InsertCategory, 'user_id'> => {
  return {
    name: formData.name,
    slug: formData.slug,
    description: formData.description || null,
    is_active: formData.is_active,
    parent_id: formData.parent_id || null
  };
};

// Date Utilities
export const formatDate = (date: Date | string, formatStr: string = 'MMM d, yyyy'): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, formatStr) : 'Invalid date';
};

export const isFutureDate = (date: Date | string): boolean => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(parsedDate, new Date());
};

export const isPastDate = (date: Date | string): boolean => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(parsedDate, new Date());
};

export const getDateRange = (days: number = 30): { from: Date; to: Date } => {
  const today = new Date();
  return {
    from: subDays(today, days),
    to: today
  };
};

// String Utilities
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  return str.length > length ? str.substring(0, length) + suffix : str;
};

export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

// Number Utilities
export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(num);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Array Utilities
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const uniqueBy = <T, K extends keyof T>(array: T[], key: K): T[] => {
  const seen = new Set<T[K]>();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// Object Utilities
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Pick<T, K>);
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

// URL Utilities
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

export const parseQueryString = <T = Record<string, string>>(queryString: string): T => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, any> = {};
  
  for (const [key, value] of params.entries()) {
    if (result[key] !== undefined) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
};

// File Utilities
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Validation Helpers
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^\+?[\d\s-]{10,}$/.test(phone);
};

// Debounce Utility
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle Utility
export const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number
): ((...args: Parameters<F>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<F>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};
