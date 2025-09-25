import { useState, useCallback, useRef } from 'react';

export interface UseApiCallReturn {
  isLoading: boolean;
  error: string | null;
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for API calls with built-in deduplication and loading state management
 * Prevents duplicate requests and handles React Strict Mode double calls
 * @param initialLoading - Initial loading state (default: false)
 * @returns Object with loading state, error state, and helper functions
 */
export const useApiCall = (initialLoading: boolean = false): UseApiCallReturn => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const currentRequestRef = useRef<Promise<unknown> | null>(null);
  const requestIdRef = useRef<string | null>(null);

  /**
   * Execute an async function with automatic loading state management and deduplication
   * @param asyncFn - The async function to execute
   * @returns The result of the async function or null if an error occurred
   */
  const execute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    // Generate a unique request ID
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // If there's already a request in progress with the same function, return the existing promise
    if (currentRequestRef.current && requestIdRef.current) {
      return currentRequestRef.current as Promise<T | null>;
    }

    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);
    
    const requestPromise = (async () => {
      try {
        // Double-check that this request is still the current one
        if (requestIdRef.current !== requestId) {
          return null;
        }
        
        const result = await asyncFn();
        
        // Check again after the async operation
        if (requestIdRef.current !== requestId) {
          return null;
        }
        
        return result;
      } catch (err) {
        // Only set error if this is still the current request
        if (requestIdRef.current === requestId) {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
          setError(errorMessage);
        }
        return null;
      } finally {
        // Only update loading state if this is still the current request
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
          currentRequestRef.current = null;
          requestIdRef.current = null;
        }
      }
    })();

    currentRequestRef.current = requestPromise;
    return requestPromise;
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    currentRequestRef.current = null;
    requestIdRef.current = null;
  }, []);

  return {
    isLoading,
    error,
    execute,
    reset
  };
};
