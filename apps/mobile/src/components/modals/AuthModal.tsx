import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ModalOverlay } from '../ui/ModalOverlay';
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { useThemeColors } from '../../hooks/useThemeColors';

interface AuthModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AuthModal = ({ visible, onClose }: AuthModalProps) => {
    const { colors, isDark } = useThemeColors();
    const { signIn, signUp } = useAuth();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Reset state when modal opens? Or keep it? 
    // Let's keep it simple for now.

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        if (!isLoginMode && password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            if (isLoginMode) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                Alert.alert("Success", "Logged in successfully!");
                onClose();
            } else {
                const { error } = await signUp(email, password);
                if (error) throw error;
                Alert.alert("Success", "Check your email for confirmation link!");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        // Reset password fields on mode switch for security/usability
        setPassword("");
        setConfirmPassword("");
    };

    return (
        <ModalOverlay visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {isLoginMode ? "Welcome Back" : "Create Account"}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {isLoginMode
                                ? "Sync your data and continue learning"
                                : "Join StudyTodo to backup your data"}
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                                <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="your@email.com"
                                    placeholderTextColor={colors.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                                <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        {/* Confirm Password Input - Only for Sign Up */}
                        {!isLoginMode && (
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                                    <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="••••••••"
                                        placeholderTextColor={colors.textSecondary}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.disabledBtn]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.btnContent}>
                                    {isLoginMode ? (
                                        <LogIn size={20} color="#fff" />
                                    ) : (
                                        <UserPlus size={20} color="#fff" />
                                    )}
                                    <Text style={styles.submitBtnText}>
                                        {isLoginMode ? "Log In" : "Sign Up"}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Toggle Mode */}
                        <TouchableOpacity
                            style={styles.toggleBtn}
                            onPress={toggleMode}
                        >
                            <Text style={styles.toggleText}>
                                {isLoginMode
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Log in"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ModalOverlay>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        maxHeight: 600,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    content: {
        padding: 20,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    submitBtn: {
        backgroundColor: '#2563eb', // Blue-600
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggleBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleText: {
        color: '#64748b',
        fontSize: 14,
    },
});
