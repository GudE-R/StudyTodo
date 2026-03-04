"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isRecovery: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signInWithProvider: (provider: Provider) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    resetPassword: (email: string) => Promise<{ error: any }>;
    updatePassword: (password: string) => Promise<{ error: any }>;
    clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isRecovery: false,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signInWithProvider: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    resetPassword: async () => ({ error: null }),
    updatePassword: async () => ({ error: null }),
    clearRecovery: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRecovery, setIsRecovery] = useState(false);

    useEffect(() => {
        // 初期セッション取得
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.warn("[AuthContext] Initial session fetch failed (possibly offline):", error);
                setSession(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        // 認証状態の変更監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovery(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = async (email: string, password: string) => {
        return await supabase.auth.signUp({ email, password });
    };

    const signInWithProvider = async (provider: Provider) => {
        return await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            },
        });
    };

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined,
        });
    };

    const updatePassword = async (password: string) => {
        return await supabase.auth.updateUser({ password });
    };

    const clearRecovery = () => {
        setIsRecovery(false);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isRecovery, signIn, signUp, signInWithProvider, signOut, resetPassword, updatePassword, clearRecovery }}>
            {children}
        </AuthContext.Provider>
    );
}
