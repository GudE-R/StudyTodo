"use client";

import React from "react";

interface LoadingSpinnerProps {
    /** Size of the spinner in pixels */
    size?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Loading Spinner Component
 * 
 * A simple, reusable loading indicator.
 */
export function LoadingSpinner({ size = 24, className = "" }: LoadingSpinnerProps) {
    return (
        <div
            className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
            style={{ width: size, height: size, color: "var(--accent-primary)" }}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

interface LoadingOverlayProps {
    /** Whether to show the overlay */
    isLoading: boolean;
    /** Optional message to display */
    message?: string;
    /** Whether to use full-screen overlay or inline */
    fullScreen?: boolean;
}

/**
 * Loading Overlay Component
 * 
 * A full-screen or container-based loading overlay.
 */
export function LoadingOverlay({ isLoading, message, fullScreen = true }: LoadingOverlayProps) {
    if (!isLoading) return null;

    const containerClass = fullScreen
        ? "fixed inset-0 z-[200] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        : "absolute inset-0 bg-white/80 dark:bg-gray-800/80";

    return (
        <div className={`${containerClass} flex flex-col items-center justify-center`}>
            <LoadingSpinner size={40} />
            {message && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            )}
        </div>
    );
}
