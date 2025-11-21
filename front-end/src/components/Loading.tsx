"use client";
import React from "react";
import { FaSpinner } from "react-icons/fa";

export interface LoadingProps {
  /** Loading state */
  isLoading: boolean;
  /** Loading text to display */
  text?: string;
  /** Size of the spinner - small, medium, large */
  size?: "small" | "medium" | "large";
  /** Type of loading display */
  type?: "spinner" | "overlay" | "inline" | "button";
  /** Custom className for styling */
  className?: string;
  /** Children to render when not loading */
  children?: React.ReactNode;
  /** Color theme */
  theme?: "light" | "dark" | "primary";
}

const Loading: React.FC<LoadingProps> = ({
  isLoading,
  text = "Loading...",
  size = "medium",
  type = "spinner",
  className = "",
  children,
  theme = "primary"
}) => {
  // Size classes for spinner
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6", 
    large: "w-8 h-8"
  };

  // Theme classes
  const themeClasses = {
    light: "text-gray-600",
    dark: "text-white",
    primary: "text-blue-600"
  };

  // Spinner component
  const Spinner = () => (
    <FaSpinner 
      className={`animate-spin ${sizeClasses[size]} ${themeClasses[theme]}`}
    />
  );

  // Loading text component
  const LoadingText = () => (
    <span className={`ml-2 ${themeClasses[theme]} font-medium`}>
      {text}
    </span>
  );

  // Render based on type
  switch (type) {
    case "overlay":
      return (
        <div className="relative">
          {children}
          {isLoading && (
            <div className={`absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 ${className}`}>
              <div className="flex flex-col items-center">
                <Spinner />
                <LoadingText />
              </div>
            </div>
          )}
        </div>
      );

    case "inline":
      if (!isLoading) return <>{children}</>;
      return (
        <div className={`flex items-center justify-center py-4 ${className}`}>
          <Spinner />
          <LoadingText />
        </div>
      );

    case "button":
      return (
        <div className={`flex items-center justify-center ${className}`}>
          {isLoading && <Spinner />}
          {isLoading ? <LoadingText /> : children}
        </div>
      );

    case "spinner":
    default:
      if (!isLoading) return <>{children}</>;
      return (
        <div className={`flex items-center justify-center ${className}`}>
          <Spinner />
          <LoadingText />
        </div>
      );
  }
};

export default Loading;
