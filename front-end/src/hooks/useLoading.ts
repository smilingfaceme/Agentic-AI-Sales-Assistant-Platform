import { useState, useCallback, useRef } from 'react';

export interface UseLoadingReturn {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  executeAsync: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook to manage loading states for async operations
 * @param initialLoading - Initial loading state (default: false)
 * @returns Object with loading state, error state, and helper functions
 */
export const useLoading = (initialLoading: boolean = false): UseLoadingReturn => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const currentRequestRef = useRef<Promise<unknown> | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setErrorState = useCallback((error: string | null) => {
    setError(error);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    currentRequestRef.current = null;
  }, []);

  /**
   * Execute an async function with automatic loading state management
   * Prevents duplicate concurrent requests
   * @param asyncFn - The async function to execute
   * @returns The result of the async function or null if an error occurred
   */
  const executeAsync = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    // If there's already a request in progress, return the existing promise
    if (currentRequestRef.current) {
      return currentRequestRef.current as Promise<T>;
    }

    setIsLoading(true);
    setError(null);

    const requestPromise = (async () => {
      try {
        const result = await asyncFn();
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
        currentRequestRef.current = null;
      }
    })();

    currentRequestRef.current = requestPromise;
    return requestPromise;
  }, []);

  return {
    isLoading,
    error,
    setLoading,
    setError: setErrorState,
    executeAsync,
    reset
  };
};
