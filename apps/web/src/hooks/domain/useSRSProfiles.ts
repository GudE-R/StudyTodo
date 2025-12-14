"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useRepository } from "@/providers/RepositoryProvider";
import { SRSProfile } from "@pomarc/shared";

export function useSRSProfiles() {
    const repository = useRepository();

    const srsProfiles = useLiveQuery(() => db.srsProfiles.toArray()) || [];

    const addSRSProfile = async (profile: SRSProfile) => {
        await repository.addSRSProfile(profile);
    };

    const updateSRSProfile = async (id: string, updates: Partial<SRSProfile>) => {
        await repository.updateSRSProfile(id, updates);
    };

    const deleteSRSProfile = async (id: string) => {
        await repository.deleteSRSProfile(id);
    };

    return {
        srsProfiles,
        addSRSProfile,
        updateSRSProfile,
        deleteSRSProfile
    };
}
