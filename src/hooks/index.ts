import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import type { Database } from '@/types/database.types';
import { toast } from 'react-hot-toast';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

// Hook for managing form state and validation
export type FormField = string | number | boolean | null | undefined | File | Date;

export const useForm = <T extends Record<string, FormField>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<keyof T, string>>(
    Object.keys(initialState).reduce((acc, key) => ({
      ...acc,
      [key]: ''
    }), {} as Record<keyof T, string>)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user types
    if (errors[name as keyof T]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  }, []);

  const setFieldValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({} as any);
  }, [initialState]);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleCheckboxChange,
    setFieldValue,
    setErrors,
    setIsSubmitting,
    resetForm,
    setFormData
  };
};

// Hook for handling API requests
export const useApiRequest = <T,>() => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await promise;
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, request };
};

// Hook for infinite scrolling
export const useInfiniteScroll = <T,>(
  fetchMore: () => Promise<void>,
  hasMore: boolean,
  isLoading: boolean,
  threshold: number = 100
) => {
  const observer = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading || !hasMore) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting) {
        fetchMore();
      }
    };

    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [fetchMore, hasMore, isLoading, threshold]);

  return { loadMoreRef };
};

// Hook for handling modals
export const useModal = <T = unknown>(initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [modalData, setModalData] = useState<T | null>(null);

  const openModal = useCallback((data: T | null = null) => {
    setModalData(data);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
    
    // Clear modal data after animation
    setTimeout(() => {
      setModalData(null);
    }, 300);
  }, []);

  return { isOpen, openModal, closeModal, modalData };
};

// Hook for handling dropdowns
// Hook for handling dropdowns
export const useDropdown = <T extends HTMLElement = HTMLDivElement>() => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<T>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && 
          !buttonRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  return {
    isOpen,
    toggleDropdown,
    closeDropdown,
    dropdownRef,
    buttonRef,
    dropdownProps: {
      ref: dropdownRef,
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox',
    },
    buttonProps: {
      ref: buttonRef,
      onClick: toggleDropdown,
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox',
    }
  };
};

// Hook for handling tabs
export const useTabs = <T extends string>(
  initialTab: T,
  tabs: readonly T[]
) => {
  const [activeTab, setActiveTab] = useState<T>(initialTab);
  const navigate = useNavigate();
  const location = window.location;

  const changeTab = useCallback((tab: T) => {
    setActiveTab(tab);
    // Update URL using React Router
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tab);
    navigate(`?${searchParams.toString()}`, { replace: true });
  }, [navigate, location.search]);

  // Sync with URL on mount
  useEffect(() => {
    const tabFromUrl = new URLSearchParams(window.location.search).get('tab');
    if (tabFromUrl && tabs.includes(tabFromUrl as T)) {
      setActiveTab(tabFromUrl as T);
    }
  }, [tabs]);

  return {
    activeTab,
    changeTab,
    tabProps: (tab: T) => ({
      'aria-selected': activeTab === tab,
      role: 'tab',
      tabIndex: activeTab === tab ? 0 : -1,
      onClick: () => changeTab(tab),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          changeTab(tab);
        }
      }
    })
  };
};

// Hook for handling keyboard shortcuts
export const useKeyboardShortcut = (
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
) => {
  const { ctrlKey = false, shiftKey = false, altKey = false, metaKey = false } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey &&
        event.metaKey === metaKey
      ) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ctrlKey, shiftKey, altKey, metaKey]);
};

// Hook for handling click outside
export const useClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};

// Hook for handling responsive design
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

// Hook for handling local storage
export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// Hook for handling session storage
export const useSessionStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// Hook for handling document title
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | Your App Name`;
    
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
};

// Hook for handling online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Hook for handling copy to clipboard
export const useCopyToClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };

  return { isCopied, copyToClipboard };
};
