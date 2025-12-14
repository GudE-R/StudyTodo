"use client";

import React, { useState } from "react";
import { X, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { syncToSupabase } from "@/lib/migration";

interface AuthModalProps {
    onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Login successful!' });

                // Sync after login
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    try {
                        await syncToSupabase(user.id);
                        console.log("Sync initiated");
                    } catch (syncErr) {
                        console.error("Sync failed", syncErr);
                    }
                }
                setTimeout(onClose, 1500);
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Check your email for the confirmation link.' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {isLogin ? "Login" : "Sign Up"}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleAuth} className="p-6 space-y-4">
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700"
                                placeholder="hello@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                                <span>{isLogin ? "Login" : "Sign Up"}</span>
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
