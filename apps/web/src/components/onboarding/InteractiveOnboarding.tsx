"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { StepWelcomeInput } from "./steps/StepWelcomeInput";
import { StepSrsAha } from "./steps/StepSrsAha";
import { StepKeepAha } from "./steps/StepKeepAha";

type OnboardingStep = "welcome-input" | "srs-aha" | "keep-aha";

interface InteractiveOnboardingProps {
    onComplete: () => void;
}

const STEPS: OnboardingStep[] = ["welcome-input", "srs-aha", "keep-aha"];

export function InteractiveOnboarding({ onComplete }: InteractiveOnboardingProps) {
    const t = useTranslations("interactiveOnboarding");
    const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome-input");
    const [studyTopic, setStudyTopic] = useState("");

    const currentIndex = STEPS.indexOf(currentStep);

    const handleComplete = () => {
        localStorage.setItem("onboarding_completed", "true");
        onComplete();
    };

    const handleSkip = () => {
        handleComplete();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header with step indicator and skip */}
            <div className="flex items-center justify-between px-6 py-4">
                <div className="text-sm text-gray-400 dark:text-gray-500">
                    {t("stepIndicator", { current: currentIndex + 1, total: STEPS.length })}
                </div>
                <button
                    onClick={handleSkip}
                    className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                    {t("skipAll")}
                </button>
            </div>

            {/* Progress bar */}
            <div className="px-6">
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Step content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                {currentStep === "welcome-input" && (
                    <StepWelcomeInput
                        onNext={(value) => {
                            setStudyTopic(value);
                            setCurrentStep("srs-aha");
                        }}
                    />
                )}
                {currentStep === "srs-aha" && (
                    <StepSrsAha
                        studyTopic={studyTopic}
                        onNext={() => setCurrentStep("keep-aha")}
                    />
                )}
                {currentStep === "keep-aha" && (
                    <StepKeepAha onNext={handleComplete} />
                )}
            </div>
        </div>
    );
}
