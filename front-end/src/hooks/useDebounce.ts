import { useCallback, useRef } from 'react';

/**
 * Custom hook to debounce function calls
 * Useful for preventing rapid successive button clicks
 * @param delay - Delay in milliseconds
 * @returns Debounced function wrapper
 */
export const useDebounce = (delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debounce = useCallback(
    <T extends (...args: any[]) => any>(func: T) => {
      return (...args: Parameters<T>) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          func(...args);
        }, delay);
      };
    },
    [delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debounce, cancel };
};
