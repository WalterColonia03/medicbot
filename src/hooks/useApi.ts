// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import type { ApiResponse } from '@/types/api';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errors: string[];
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
}

/**
Hook personalizado para llamadas a API */
export function useApi<T = unknown>(
  options?: UseApiOptions<T>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const execute = useCallback(
    async (url: string, fetchOptions?: RequestInit): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setErrors([]);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions?.headers,
          },
          ...fetchOptions,
        });

        const result: ApiResponse<T> = await response.json();

        if (!response.ok || !result.success) {
          const errorMessage = result.message || result.error || 'Error desconocido';
          const errorList = result.errors || [];

          setError(errorMessage);
          setErrors(errorList);

          if (options?.onError) {
            options.onError(errorMessage);
          }

          return null;
        }

        const responseData = result.data as T;
        setData(responseData);

        if (options?.onSuccess) {
          options.onSuccess(responseData);
        }

        return responseData;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error de conexión';

        setError(errorMessage);

        if (options?.onError) {
          options.onError(errorMessage);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setErrors([]);
  }, []);

  return {
    data,
    loading,
    error,
    errors,
    execute,
    reset,
  };
}

/**
Hook especializado para GET */
export function useApiGet<T = unknown>(
  url: string,
  options?: UseApiOptions<T>
): UseApiReturn<T> & { refetch: () => Promise<T | null> } {
  const api = useApi<T>(options);

  const refetch = useCallback(() => {
    return api.execute(url, { method: 'GET' });
  }, [url, api]);

  return { ...api, refetch };
}

/**
Hook especializado para POST */
export function useApiPost<T = unknown, D = unknown>(
  options?: UseApiOptions<T>
): UseApiReturn<T> & { post: (url: string, data: D) => Promise<T | null> } {
  const api = useApi<T>(options);

  const post = useCallback(
    (url: string, data: D) => {
      return api.execute(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    [api]
  );

  return { ...api, post };
}

/**
Hook especializado para PUT */
export function useApiPut<T = unknown, D = unknown>(
  options?: UseApiOptions<T>
): UseApiReturn<T> & { put: (url: string, data: D) => Promise<T | null> } {
  const api = useApi<T>(options);

  const put = useCallback(
    (url: string, data: D) => {
      return api.execute(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    [api]
  );

  return { ...api, put };
}

/**
Hook especializado para DELETE */
export function useApiDelete<T = unknown>(
  options?: UseApiOptions<T>
): UseApiReturn<T> & { del: (url: string) => Promise<T | null> } {
  const api = useApi<T>(options);

  const del = useCallback(
    (url: string) => {
      return api.execute(url, { method: 'DELETE' });
    },
    [api]
  );

  return { ...api, del };
}
