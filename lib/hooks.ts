'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, propertiesApi, unitsApi, peopleApi } from './api';
import { User, Property, Unit, Person } from './types';
import { getFromStorage, setToStorage } from './utils';

// Authentication hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.me();
      
      if (response.error) {
        setUser(null);
        setError(response.error);
      } else {
        setUser(response.data as User);
      }
    } catch (err) {
      setUser(null);
      setError('Authentication check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login(email, password);
      
      if (response.error) {
        setError(response.error);
        return false;
      } else {
        setUser((response.data as any).user as User);
        router.push('/dashboard');
        return true;
      }
    } catch (err) {
      setError('Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push('/home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.register(name, email, password);
      
      if (response.error) {
        setError(response.error);
        return false;
      } else {
        setUser((response.data as any).user as User);
        router.push('/dashboard');
        return true;
      }
    } catch (err) {
      setError('Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    checkAuth,
    isAuthenticated: !!user,
  };
}

// Properties hook
export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await propertiesApi.getAll();
      
      if (response.error) {
        setError(response.error);
      } else {
        setProperties((response.data as Property[]) || []);
      }
    } catch (err) {
      setError('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProperty = useCallback(async (data: any) => {
    try {
      const response = await propertiesApi.create(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchProperties();
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [fetchProperties]);

  const updateProperty = useCallback(async (id: string, data: any) => {
    try {
      const response = await propertiesApi.update(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchProperties();
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [fetchProperties]);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      const response = await propertiesApi.delete(id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchProperties();
    } catch (err) {
      throw err;
    }
  }, [fetchProperties]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}

// Property hook
export function useProperty(id: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await propertiesApi.getById(id);
      
      if (response.error) {
        setError(response.error);
      } else {
        setProperty(response.data as Property);
      }
    } catch (err) {
      setError('Failed to fetch property');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return {
    property,
    loading,
    error,
    fetchProperty,
  };
}

// Units hook
export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await unitsApi.getAll();
      
      if (response.error) {
        setError(response.error);
      } else {
        setUnits((response.data as Unit[]) || []);
      }
    } catch (err) {
      setError('Failed to fetch units');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUnit = useCallback(async (data: any) => {
    try {
      const response = await unitsApi.create(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchUnits();
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [fetchUnits]);

  const updateUnit = useCallback(async (id: string, data: any) => {
    try {
      const response = await unitsApi.update(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchUnits();
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [fetchUnits]);

  const deleteUnit = useCallback(async (id: string) => {
    try {
      const response = await unitsApi.delete(id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchUnits();
    } catch (err) {
      throw err;
    }
  }, [fetchUnits]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return {
    units,
    loading,
    error,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
  };
}

// People hook
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await peopleApi.getAll();
      
      if (response.error) {
        setError(response.error);
      } else {
        setPeople((response.data as Person[]) || []);
      }
    } catch (err) {
      setError('Failed to fetch people');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPerson = useCallback(async (data: any) => {
    try {
      const response = await peopleApi.create(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchPeople();
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [fetchPeople]);

  const updatePerson = useCallback(async (id: string, data: any) => {
    try {
      const response = await peopleApi.update(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchPeople();
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [fetchPeople]);

  const deletePerson = useCallback(async (id: string) => {
    try {
      const response = await peopleApi.delete(id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      await fetchPeople();
    } catch (err) {
      throw err;
    }
  }, [fetchPeople]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  return {
    people,
    loading,
    error,
    fetchPeople,
    createPerson,
    updatePerson,
    deletePerson,
  };
}

// Theme hook
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = getFromStorage<'light' | 'dark'>('vt-theme', 'light');
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setToStorage('vt-theme', newTheme);
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  }, [theme]);

  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  return {
    theme,
    mounted,
    toggleTheme,
  };
}

// Form hook
export function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldError,
    setFieldValue,
    resetForm,
    setSubmitting,
  };
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getFromStorage(key, initialValue);
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      setToStorage(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Intersection observer hook
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return [setRef, isIntersecting] as const;
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}
