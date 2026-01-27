import { useState, useCallback, useEffect } from 'react';
import { SRSProfile, Todo } from '@studytodo/shared';
import { useRepository } from '../providers/RepositoryProvider';
import { addDays } from 'date-fns';

export function useMobileSRS() {
    const repository = useRepository();
    const [profiles, setProfiles] = useState<SRSProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await repository.getSRSProfiles();
            setProfiles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [repository]);

    useEffect(() => {
        refreshProfiles();
    }, [refreshProfiles]);

    const calculateNextReview = (currentLevel: number, profile: SRSProfile): { nextDate: Date, nextLevel: number } => {
        const intervals = (profile.intervals && profile.intervals.length > 0)
            ? profile.intervals
            : [1, 3, 7, 14, 30, 90];

        let interval = 0;
        if (currentLevel < intervals.length) {
            interval = intervals[currentLevel];
        } else {
            interval = intervals[intervals.length - 1];
        }

        const nextDate = addDays(new Date(), interval);
        return { nextDate, nextLevel: currentLevel + 1 };
    };

    const processReview = async (todo: Todo, correct: boolean, profile?: SRSProfile) => {
        if (!todo.srsProfileId && !profile) return;

        // Find profile if ID exists but object not passed
        const activeProfile = profile || profiles.find(p => p.id === todo.srsProfileId) || { intervals: [1, 3, 7], id: 'default', name: 'Default', createdAt: new Date(), updatedAt: new Date() } as SRSProfile;

        let nextLevel = todo.srsLevel || 0;
        let nextReviewDate = todo.nextReviewDate ? new Date(todo.nextReviewDate) : new Date();

        if (correct) {
            const result = calculateNextReview(nextLevel, activeProfile);
            nextLevel = result.nextLevel;
            nextReviewDate = result.nextDate;
        } else {
            nextLevel = 0;
            nextReviewDate = addDays(new Date(), 1);
        }

        await repository.updateTodo(todo.id, {
            srsLevel: nextLevel,
            nextReviewDate: (nextReviewDate instanceof Date && !isNaN(nextReviewDate.getTime())) ? nextReviewDate.toISOString() : new Date().toISOString(),
            reviewHistory: [
                ...(todo.reviewHistory || []),
                { date: new Date().toISOString(), correct }
            ]
        });
    };

    const addSRSProfile = async (profile: SRSProfile) => {
        await repository.addSRSProfile(profile);
        await refreshProfiles();
    };

    const updateSRSProfile = async (id: string, updates: Partial<SRSProfile>) => {
        await repository.updateSRSProfile(id, updates);
        await refreshProfiles();
    };

    const deleteSRSProfile = async (id: string) => {
        await repository.deleteSRSProfile(id);
        await refreshProfiles();
    };

    return {
        profiles,
        loading,
        refreshProfiles,
        processReview,
        addSRSProfile,
        updateSRSProfile,
        deleteSRSProfile
    };
}
