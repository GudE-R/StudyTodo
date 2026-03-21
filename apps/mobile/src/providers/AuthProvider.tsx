import React, { createContext, useContext } from 'react';

// Auth is disabled until Pro plan. This provider returns stub values
// so existing useAuth() calls don't break.

type AuthContextType = {
    user: { id: string; email?: string } | null;
    session: null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    resetPassword: (email: string) => Promise<{ error: any }>;
    updatePassword: (password: string) => Promise<{ error: any }>;
    deleteAccount: () => Promise<{ error: any }>;
};

const noop = async () => ({ error: null });

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: false,
    signIn: noop,
    signUp: noop,
    signOut: noop,
    resetPassword: noop,
    updatePassword: noop,
    deleteAccount: noop,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthContext.Provider value={{
            user: null,
            session: null,
            loading: false,
            signIn: noop,
            signUp: noop,
            signOut: noop,
            resetPassword: noop,
            updatePassword: noop,
            deleteAccount: noop,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
