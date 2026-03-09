"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, Provider, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isRecovery: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithProvider: (provider: Provider) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
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
    clearRecovery: () => { },
});

export const useAuth = () => useContext(AuthContext);

// 環境変数から本番URLを取得（ローカル環境でもパスワードリセット等で本番URLを使用するため）
const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
};

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
                redirectTo: getBaseUrl() || undefined,
            },
        });
    };

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${getBaseUrl()}/auth`,
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
