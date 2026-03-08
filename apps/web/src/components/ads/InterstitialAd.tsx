"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AdBanner } from "./AdBanner";

interface InterstitialAdProps {
    isOpen: boolean;
    onClose: () => void;
    /** Optional message shown above the ad */
    message?: string;
    /** Auto-close after X seconds (0 = disabled) */
    autoCloseSeconds?: number;
}

/**
 * Interstitial Ad Modal
 * 
 * Full-screen modal that displays an ad.
 * Used during break time and after task completion.
 * Respects ad-free status from localStorage.
 */
export function InterstitialAd({ isOpen, onClose, message, autoCloseSeconds = 5 }: InterstitialAdProps) {
    const [countdown, setCountdown] = useState(autoCloseSeconds);
    const [isAdFree, setIsAdFree] = useState(false);

    // Check ad-free status
    useEffect(() => {
        const checkAdFreeStatus = () => {
            const adFreeUntil = localStorage.getItem("adFreeUntil");
            if (adFreeUntil) {
                const expiration = new Date(adFreeUntil);
                setIsAdFree(new Date() < expiration);
            } else {
                setIsAdFree(false);
            }
        };

        checkAdFreeStatus();

        // Listen for ad-free status changes
        window.addEventListener("adFreeStatusChanged", checkAdFreeStatus);
        return () => window.removeEventListener("adFreeStatusChanged", checkAdFreeStatus);
    }, [isOpen]);

    // Countdown timer for auto-close
    useEffect(() => {
        if (!isOpen || autoCloseSeconds === 0) return;

        setCountdown(autoCloseSeconds);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, autoCloseSeconds, onClose]);

    // If ad-free, don't show the modal
    if (isAdFree) {
        // Auto-close immediately if opened while ad-free
        if (isOpen) {
            setTimeout(onClose, 0);
        }
        return null;
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {message || "広告"}
                    </div>
                    <div className="flex items-center space-x-3">
                        {autoCloseSeconds > 0 && countdown > 0 && (
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                {countdown}秒後に閉じます
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Ad Content */}
                <div className="p-6">
                    <AdBanner
                        style={{ minHeight: "250px" }}
                        format="rectangle"
                    />
                </div>

                {/* Footer with skip info */}
                <div className="px-4 pb-4 text-center">
                    <p className="text-xs text-gray-400">
                        Activityタブからシェアすると24時間広告OFFになります
                    </p>
                </div>
            </div>
        </div>
    );
}
