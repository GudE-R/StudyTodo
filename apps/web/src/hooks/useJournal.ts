"use client";

import { useState, useCallback, useEffect } from "react";
import { JournalPost, JournalSettings } from "@studytodo/shared";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";

const JOURNAL_SETTINGS_KEY = 'studytodo_journal_settings';

const DEFAULT_SETTINGS: JournalSettings = {
    enabled: false,
    autoPromptOnComplete: true,
};

const settingsListeners = new Set<(s: JournalSettings) => void>();

export function useJournalSettings() {
    const [settings, setSettings] = useState<JournalSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(JOURNAL_SETTINGS_KEY);
        if (saved) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            } catch {
                // 破損データは無視してデフォルトを使う
            }
        }
        setIsLoaded(true);

        const listener = (s: JournalSettings) => setSettings(s);
        settingsListeners.add(listener);
        return () => { settingsListeners.delete(listener); };
    }, []);

    const updateSettings = useCallback((updates: Partial<JournalSettings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        localStorage.setItem(JOURNAL_SETTINGS_KEY, JSON.stringify(newSettings));
        settingsListeners.forEach(fn => fn(newSettings));
    }, [settings]);

    return { settings, updateSettings, isLoaded };
}

export function useJournal() {
    const posts = useLiveQuery(
        () => db.journalPosts.orderBy('createdAt').reverse().toArray()
    ) || [];

    const addPost = useCallback(async (post: Omit<JournalPost, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newPost: JournalPost = {
            ...post,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        await db.journalPosts.add(newPost);
        return newPost;
    }, []);

    const deletePost = useCallback(async (id: string) => {
        await db.journalPosts.delete(id);
    }, []);

    return { posts, addPost, deletePost };
}
