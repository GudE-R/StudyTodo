"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SRSProfile, Todo } from "@studytodo/shared";
import { dataService } from "@/services/dataService";
import { generateId } from "@/lib/utils";
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
    const [srsProfile, setSrsProfile] = useState<SRSProfile | null>(null);
    const completingRef = useRef(false);

    const currentIndex = STEPS.indexOf(currentStep);

    const handleComplete = async () => {
        if (completingRef.current) return;
        completingRef.current = true;

        // 2ステップ目で確定した学習内容は最後に保存する。途中で保存すると
        // ホームの「タスク0件ならオンボーディング」の条件が外れ、3ステップ目の前に画面が切り替わるため
        if (studyTopic && srsProfile) {
            const baseTodo: Todo = {
                id: generateId(),
                title: studyTopic,
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                dueDate: new Date(),
                srsInterval: srsProfile.name,
                srsProfileId: srsProfile.id,
            };
            await dataService.addSRSTodos(baseTodo, srsProfile.intervals);
        }
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
                        onNext={(profile) => {
                            setSrsProfile(profile);
                            setCurrentStep("keep-aha");
                        }}
                    />
                )}
                {currentStep === "keep-aha" && (
                    <StepKeepAha onNext={handleComplete} />
                )}
            </div>
        </div>
    );
}
