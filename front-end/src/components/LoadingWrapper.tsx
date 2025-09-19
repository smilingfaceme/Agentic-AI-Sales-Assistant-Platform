"use client";
import React from "react";
import Loading, { LoadingProps } from "./Loading";

interface LoadingWrapperProps extends Omit<LoadingProps, 'isLoading'> {
  /** Loading state */
  isLoading: boolean;
  /** Error message to display */
  error?: string | null;
  /** Show error message */
  showError?: boolean;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Minimum loading time in ms to prevent flashing */
  minLoadingTime?: number;
}

/**
 * Wrapper component that handles loading and error states
 * Useful for wrapping components that make API calls
 */
const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  error,
  showError = false,
  errorComponent,
  children,
  minLoadingTime = 0,
  ...loadingProps
}) => {
  const [shouldShowLoading, setShouldShowLoading] = React.useState(isLoading);
  const loadingStartTime = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      loadingStartTime.current = Date.now();
      setShouldShowLoading(true);
    } else if (loadingStartTime.current && minLoadingTime > 0) {
      const elapsed = Date.now() - loadingStartTime.current;
      const remaining = minLoadingTime - elapsed;
      
      if (remaining > 0) {
        setTimeout(() => {
          setShouldShowLoading(false);
        }, remaining);
      } else {
        setShouldShowLoading(false);
      }
    } else {
      setShouldShowLoading(false);
    }
  }, [isLoading, minLoadingTime]);

  // Show error if there's an error and showError is true
  if (error && showError && !shouldShowLoading) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Error
          </div>
          <div className="text-gray-600 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Loading isLoading={shouldShowLoading} {...loadingProps}>
      {children}
    </Loading>
  );
};

export default LoadingWrapper;
