import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { ModalOverlay } from '../ui/ModalOverlay';
import { useTranslation } from 'react-i18next';
import { X, Send, Lightbulb, AlertCircle, HelpCircle, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '../../providers/ThemeProvider';
import { useRepository } from '../../providers/RepositoryProvider';
import { useAuth } from '../../providers/AuthProvider';
import { generateId, Feedback } from '@studytodo/shared';
import { supabase } from '../../lib/supabase';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
}

export const FeedbackModal = ({ visible, onClose }: FeedbackModalProps) => {
    const { colors, isDark } = useThemeColors();
    const { t } = useTranslation();
    const repository = useRepository();
    const { user } = useAuth();

    const [content, setContent] = useState('');
    const [type, setType] = useState<Feedback['type']>('request');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset state when opening
    React.useEffect(() => {
        if (visible) {
            setContent('');
            setType('request');
            setIsSuccess(false);
            setIsSubmitting(false);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const feedback: Feedback = {
                id: generateId(),
                userId: user?.id,
                content: content.trim(),
                type,
                deviceInfo: `${Platform.OS} ${Platform.Version}`,
                version: '1.0.0', // TODO: Get specific version
                createdAt: new Date(),
            };

            await repository.addFeedback(feedback);

            // If user is NOT logged in, manual send to Supabase
            // (Logged in users are handled by useMobileRealtimeSync)
            if (!user) {
                const createdAtStr = feedback.createdAt instanceof Date
                    ? feedback.createdAt.toISOString()
                    : new Date(feedback.createdAt).toISOString();

                const { error } = await supabase.from('feedbacks').insert({
                    id: feedback.id,
                    user_id: null,
                    content: feedback.content,
                    type: feedback.type,
                    device_info: feedback.deviceInfo,
                    version: feedback.version,
                    created_at: createdAtStr,
                });

                if (error) {
                    console.error('Failed to send anonymous feedback:', error);
                    throw error;
                }
            }

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Feedback submission failed:', error);
            Alert.alert(t('common.error'), t('feedback.submitFailed', 'Failed to submit feedback.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const types: { id: Feedback['type']; label: string; icon: any; color: string; bgColor: string }[] = [
        { id: 'request', label: t('feedback.typeRequest', 'Request'), icon: Lightbulb, color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.1)' },
        { id: 'bug', label: t('feedback.typeBug', 'Bug'), icon: AlertCircle, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
        { id: 'other', label: t('feedback.typeOther', 'Other'), icon: HelpCircle, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    ];

    // if (!visible) return null; // Removed to keep Modal mounted

    return (
        <ModalOverlay visible={visible} animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MessageSquare size={20} color={colors.primary} />
                            <Text style={[styles.title, { color: colors.text }]}>{t('guide.feedbackTitle', 'Send Feedback')}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {isSuccess ? (
                        <View style={styles.successContainer}>
                            <View style={[styles.successIcon, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' }]}>
                                <Send size={32} color={isDark ? '#4ade80' : '#16a34a'} />
                            </View>
                            <Text style={[styles.successTitle, { color: colors.text }]}>{t('feedback.successTitle', 'Sent!')}</Text>
                            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
                                {t('feedback.successMessage', 'Thank you for your feedback.')}
                            </Text>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.content}>
                            {/* Type Selection */}
                            <View style={styles.typeContainer}>
                                {types.map((item) => {
                                    const isSelected = type === item.id;
                                    const Icon = item.icon;
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.typeBtn,
                                                { borderColor: colors.border },
                                                isSelected && { borderColor: item.color, backgroundColor: isDark ? item.bgColor : item.bgColor }
                                            ]}
                                            onPress={() => setType(item.id)}
                                        >
                                            <Icon size={24} color={isSelected ? item.color : colors.icon} />
                                            <Text style={[
                                                styles.typeLabel,
                                                { color: colors.textSecondary },
                                                isSelected && { color: item.color, fontWeight: 'bold' }
                                            ]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Content Input */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                {t('feedback.contentLabel', 'Content')} <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                        borderColor: colors.border,
                                        color: colors.text
                                    }
                                ]}
                                multiline
                                placeholder={t('feedback.placeholder', 'Please describe your feedback...')}
                                placeholderTextColor={colors.textMuted}
                                value={content}
                                onChangeText={setContent}
                                textAlignVertical="top"
                            />

                            {/* Submit Button */}
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                                    onPress={onClose}
                                >
                                    <Text style={[styles.cancelText, { color: colors.text }]}>{t('common.cancel', 'Cancel')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.submitBtn,
                                        { backgroundColor: colors.primary },
                                        (!content.trim() || isSubmitting) && { opacity: 0.5 }
                                    ]}
                                    disabled={!content.trim() || isSubmitting}
                                    onPress={handleSubmit}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Send size={18} color="#fff" />
                                            <Text style={styles.submitText}>{t('feedback.submit', 'Send')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
        </ModalOverlay>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        padding: 0, // Remove padding to be flush or handle in container
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        maxHeight: '80%',
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    typeLabel: {
        fontSize: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    textInput: {
        height: 150,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        marginBottom: 20,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontWeight: 'bold',
    },
    submitBtn: {
        flex: 2,
        flexDirection: 'row',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    successContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    successMessage: {
        textAlign: 'center',
        lineHeight: 20,
    },
});
