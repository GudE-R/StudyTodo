
import { useCallback } from 'react';
import { Todo, SRSProfile } from '@pomarc/shared';
import { addDays } from 'date-fns';
import { useRepository } from '../providers/RepositoryProvider';

export function useSRS() {
    const repository = useRepository();

    const calculateNextReview = (currentLevel: number, profile: SRSProfile): { nextDate: Date, nextLevel: number } => {
        // Default intervals if not set. Format: [1, 3, 7, 14, 30...]
        const intervals = (profile.intervals && profile.intervals.length > 0)
            ? profile.intervals
            : [1, 3, 7, 14, 30, 90];

        // If level exceeds intervals, use last interval or cap? usually cap or linear increase.
        // For now, use last interval * multiplier or just capped.
        let interval = 0;
        if (currentLevel < intervals.length) {
            interval = intervals[currentLevel];
        } else {
            // Fallback: Max interval
            interval = intervals[intervals.length - 1];
        }

        const nextDate = addDays(new Date(), interval);
        return { nextDate, nextLevel: currentLevel + 1 };
    };

    const processReview = async (todo: Todo, correct: boolean, profile?: SRSProfile) => {
        if (!todo.srsProfileId) return; // Not an SRS todo?

        // Fetch profile if not passed? 
        // ideally we have it. For now assume default if missing?
        const useProfile = profile || { intervals: [1, 3, 7] } as SRSProfile;

        let nextLevel = todo.srsLevel || 0;
        let nextReviewDate = todo.nextReviewDate ? new Date(todo.nextReviewDate) : new Date();

        if (correct) {
            const result = calculateNextReview(nextLevel, useProfile);
            nextLevel = result.nextLevel;
            nextReviewDate = result.nextDate;
        } else {
            // Incorrect: Reset level? Or decrement?
            // "Pimsleur" style: Reset to 0 or 1.
            nextLevel = 0;
            nextReviewDate = addDays(new Date(), 1); // Review tomorrow
        }

        await repository.updateTodo(todo.id, {
            srsLevel: nextLevel,
            nextReviewDate: nextReviewDate.toISOString(),
            reviewHistory: [
                ...(todo.reviewHistory || []),
                { date: new Date().toISOString(), correct }
            ]
        });
    };

    return {
        processReview
    };
}
