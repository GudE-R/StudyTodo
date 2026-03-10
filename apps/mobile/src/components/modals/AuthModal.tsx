import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { ModalOverlay } from '../ui/ModalOverlay';
import { X, Mail, Lock, LogIn, UserPlus, Check } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTranslation } from 'react-i18next';
import { TermsModal } from './TermsModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface AuthModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AuthModal = ({ visible, onClose }: AuthModalProps) => {
    const { colors, isDark } = useThemeColors();
    const { signIn, signUp, resetPassword } = useAuth();
    const { t } = useTranslation();

    const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const isLoginMode = mode === "login";
    const isResetMode = mode === "reset";

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password: string): boolean => {
        return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    };

    const handleAuth = async () => {
        if (!email || !isValidEmail(email)) {
            Alert.alert(t('auth.errorOccurred', 'Error'), t('auth.invalidEmail', 'Please enter a valid email address'));
            return;
        }

        if (isResetMode) {
            setLoading(true);
            try {
                const { error } = await resetPassword(email);
                if (error) throw error;
                Alert.alert("Success", `${t('auth.resetEmailSent', 'Password reset email sent. Please check your inbox.')}\n\n${t('auth.resetViaWeb', 'Please use the link in the email to change your password in a web browser.')}`);
            } catch (error: any) {
                Alert.alert(t('auth.errorOccurred', 'Error'), error.message || t('auth.errorOccurred', 'Something went wrong'));
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!password) {
            Alert.alert(t('auth.errorOccurred', 'Error'), t('auth.invalidEmail', 'Please enter a valid email address'));
            return;
        }

        if (!isLoginMode) {
            if (!isValidPassword(password)) {
                Alert.alert(t('auth.errorOccurred', 'Error'), t('auth.weakPassword', 'Password must be at least 8 characters with letters and numbers'));
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert(t('auth.errorOccurred', 'Error'), t('auth.passwordMismatch', 'Passwords do not match'));
                return;
            }
        }

        if (!isResetMode && !agreeToTerms) {
            Alert.alert(t('auth.errorOccurred', 'Error'), t('auth.mustAgreeTerms', 'Please agree to the Terms and Privacy Policy'));
            return;
        }

        setLoading(true);
        try {
            if (isLoginMode) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                Alert.alert("Success", t('auth.loginSuccess', 'Logged in successfully!'));
                onClose();
            } else {
                const { error } = await signUp(email, password);
                if (error) throw error;
                Alert.alert("Success", t('auth.checkEmail', 'Check your email for confirmation link!'));
            }
        } catch (error: any) {
            Alert.alert(t('auth.errorOccurred', 'Error'), error.message || t('auth.errorOccurred', 'Something went wrong'));
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        if (isResetMode) {
            setMode("login");
        } else if (isLoginMode) {
            setMode("signup");
        } else {
            setMode("login");
        }
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
                            {isResetMode ? t('auth.resetPassword', 'Reset Password') : isLoginMode ? t('auth.welcomeBack', 'Welcome Back') : t('auth.createAccount', 'Create Account')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {isResetMode
                                ? t('auth.resetDescription', 'Enter your email to receive a password reset link')
                                : isLoginMode
                                    ? t('auth.signInDescription', 'Sync your data and continue learning')
                                    : t('auth.signUpDescription', 'Join StudyTodo to backup your data')}
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: colors.text }]}>{t('auth.email', 'Email')}</Text>
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
                        {!isResetMode && (
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>{t('auth.password', 'Password')}</Text>
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
                                {!isLoginMode && (
                                    <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('auth.passwordHint', 'At least 8 characters with letters and numbers')}</Text>
                                )}
                                {isLoginMode && (
                                    <TouchableOpacity onPress={() => setMode("reset")} style={styles.forgotBtn}>
                                        <Text style={styles.forgotText}>{t('auth.forgotPassword', 'Forgot password?')}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Confirm Password Input - Only for Sign Up */}
                        {!isLoginMode && !isResetMode && (
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>{t('auth.confirmPassword', 'Confirm Password')}</Text>
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

                        {/* Terms and Privacy Policy Consent */}
                        {!isResetMode && (
                            <View style={styles.termsContainer}>
                                <TouchableOpacity
                                    style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
                                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                                >
                                    {agreeToTerms && <Check size={14} color="#fff" />}
                                </TouchableOpacity>
                                <View style={styles.termsTextContainer}>
                                    <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                                        <Text
                                            style={[styles.linkText, { color: colors.primary }]}
                                            onPress={() => setShowTerms(true)}
                                        >
                                            {t('common.termsOfService', 'Terms of Service')}
                                        </Text>
                                        <Text> と </Text>
                                        <Text
                                            style={[styles.linkText, { color: colors.primary }]}
                                            onPress={() => setShowPrivacy(true)}
                                        >
                                            {t('common.privacyPolicy', 'Privacy Policy')}
                                        </Text>
                                        <Text> に同意します。</Text>
                                    </Text>
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
                                    {isResetMode ? (
                                        <Mail size={20} color="#fff" />
                                    ) : isLoginMode ? (
                                        <LogIn size={20} color="#fff" />
                                    ) : (
                                        <UserPlus size={20} color="#fff" />
                                    )}
                                    <Text style={styles.submitBtnText}>
                                        {isResetMode ? t('auth.sendResetLink', 'Send Reset Link') : isLoginMode ? t('auth.loginButton', 'Log In') : t('auth.signUpButton', 'Sign Up')}
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
                                {isResetMode
                                    ? t('auth.backToLogin', 'Back to login')
                                    : isLoginMode
                                        ? t('auth.noAccountLink', "Don't have an account? Sign up")
                                        : t('auth.haveAccountLink', 'Already have an account? Log in')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <TermsModal
                visible={showTerms}
                onClose={() => setShowTerms(false)}
            />
            <PrivacyPolicyModal
                visible={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
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
    hint: {
        fontSize: 12,
        marginTop: 4,
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
    forgotBtn: {
        marginTop: 4,
        marginLeft: 4,
    },
    forgotText: {
        color: '#2563eb',
        fontSize: 12,
    },
    toggleBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleText: {
        color: '#64748b',
        fontSize: 14,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginLeft: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#2563eb',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#2563eb',
    },
    termsTextContainer: {
        flex: 1,
    },
    termsText: {
        fontSize: 12,
        lineHeight: 18,
    },
    linkText: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
