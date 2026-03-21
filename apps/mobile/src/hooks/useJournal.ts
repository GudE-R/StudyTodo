import { useState, useCallback, useEffect } from "react";
import { JournalPost, JournalSettings } from "@studytodo/shared";
import { generateId } from "../lib/utils";
import { useRepository } from "../providers/RepositoryProvider";
import { SQLiteRepository } from "../repositories/SQLiteRepository";
import AsyncStorage from "@react-native-async-storage/async-storage";

const JOURNAL_SETTINGS_KEY = '@studytodo_journal_settings';

const DEFAULT_SETTINGS: JournalSettings = {
    enabled: false,
    autoPromptOnComplete: true,
};

export function useJournalSettings() {
    const [settings, setSettings] = useState<JournalSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(JOURNAL_SETTINGS_KEY).then((saved) => {
            if (saved) {
                try {
                    setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
                } catch {}
            }
            setIsLoaded(true);
        });
    }, []);

    const updateSettings = useCallback(async (updates: Partial<JournalSettings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        await AsyncStorage.setItem(JOURNAL_SETTINGS_KEY, JSON.stringify(newSettings));
    }, [settings]);

    return { settings, updateSettings, isLoaded };
}

export function useJournal() {
    const repository = useRepository() as SQLiteRepository;
    const [posts, setPosts] = useState<JournalPost[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshPosts = useCallback(async (options?: { type?: string; limit?: number; offset?: number }) => {
        setLoading(true);
        try {
            const data = await repository.getJournalPosts(options);
            setPosts(data);
        } catch (error) {
            console.error('Error fetching journal posts:', error);
        } finally {
            setLoading(false);
        }
    }, [repository]);

    useEffect(() => {
        refreshPosts();

        const unsubscribe = repository.onDataChange((table) => {
            if (table === 'journalPosts') {
                refreshPosts();
            }
        });

        return unsubscribe;
    }, [repository, refreshPosts]);

    const addPost = useCallback(async (post: Omit<JournalPost, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newPost: JournalPost = {
            ...post,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        await repository.addJournalPost(newPost);
        return newPost;
    }, [repository]);

    const updatePost = useCallback(async (id: string, updates: Partial<JournalPost>) => {
        await repository.updateJournalPost(id, updates);
    }, [repository]);

    const deletePost = useCallback(async (id: string) => {
        await repository.deleteJournalPost(id);
    }, [repository]);

    return {
        posts,
        loading,
        refreshPosts,
        addPost,
        updatePost,
        deletePost,
    };
}
