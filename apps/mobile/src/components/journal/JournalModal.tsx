import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ModalOverlay } from '../ui/ModalOverlay';
import { X, Send, StickyNote, Lightbulb, Eye, Flag, Smile } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../providers/ThemeProvider';
import { useJournal } from '../../hooks/useJournal';
import { JournalPost } from '@studytodo/shared';
import { JournalPostCard } from './JournalPostCard';

interface JournalModalProps {
    visible: boolean;
    onClose: () => void;
}

type PostType = JournalPost['type'];
type Mood = NonNullable<JournalPost['mood']>;

const POST_TYPES: { type: PostType; icon: typeof StickyNote; labelKey: string }[] = [
    { type: 'note', icon: StickyNote, labelKey: 'journal.typeNote' },
    { type: 'learning', icon: Lightbulb, labelKey: 'journal.typeLearning' },
    { type: 'reflection', icon: Eye, labelKey: 'journal.typeReflection' },
    { type: 'milestone', icon: Flag, labelKey: 'journal.typeMilestone' },
];

const MOODS: { mood: Mood; emoji: string }[] = [
    { mood: 'great', emoji: '😄' },
    { mood: 'good', emoji: '🙂' },
    { mood: 'neutral', emoji: '😐' },
    { mood: 'bad', emoji: '😞' },
    { mood: 'terrible', emoji: '😢' },
];

export const JournalModal = ({ visible, onClose }: JournalModalProps) => {
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const { posts, addPost, deletePost } = useJournal();

    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<PostType>('note');
    const [selectedMood, setSelectedMood] = useState<Mood | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await addPost({
                content: content.trim(),
                type: postType,
                mood: selectedMood,
            });
            setContent('');
            setSelectedMood(undefined);
            setPostType('note');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deletePost(id);
    };

    return (
        <ModalOverlay visible={visible} animationType="slide">
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {t('journal.title', 'Journal')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Timeline */}
                    <FlatList
                        data={posts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <JournalPostCard post={item} onDelete={handleDelete} />
                        )}
                        contentContainerStyle={styles.timeline}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {t('journal.empty', 'No entries yet. Share your thoughts!')}
                                </Text>
                            </View>
                        }
                    />

                    {/* Composer */}
                    <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
                        {/* Type selector */}
                        <View style={styles.typeRow}>
                            {POST_TYPES.map(({ type, icon: Icon, labelKey }) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeChip,
                                        { backgroundColor: colors.surfaceHighlight },
                                        postType === type && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                                    ]}
                                    onPress={() => setPostType(type)}
                                >
                                    <Icon size={14} color={postType === type ? colors.primary : colors.textSecondary} />
                                    <Text style={[
                                        styles.typeChipText,
                                        { color: colors.textSecondary },
                                        postType === type && { color: colors.primary },
                                    ]}>
                                        {t(labelKey, type)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Mood selector */}
                        <View style={styles.moodRow}>
                            {MOODS.map(({ mood, emoji }) => (
                                <TouchableOpacity
                                    key={mood}
                                    style={[
                                        styles.moodBtn,
                                        selectedMood === mood && { backgroundColor: colors.primaryLight },
                                    ]}
                                    onPress={() => setSelectedMood(selectedMood === mood ? undefined : mood)}
                                >
                                    <Text style={styles.moodEmoji}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Input + Send */}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surfaceHighlight, color: colors.text }]}
                                placeholder={t('journal.placeholder', "What's on your mind?")}
                                placeholderTextColor={colors.textMuted}
                                value={content}
                                onChangeText={setContent}
                                multiline
                                maxLength={2000}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: content.trim() ? colors.primary : colors.surfaceHighlight }]}
                                onPress={handleSubmit}
                                disabled={!content.trim() || isSubmitting}
                            >
                                <Send size={20} color={content.trim() ? '#fff' : colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ModalOverlay>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        paddingTop: 50,
        paddingBottom: 30,
    },
    container: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
        borderRadius: 20,
    },
    timeline: {
        padding: 15,
        paddingBottom: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    composer: {
        padding: 12,
        borderTopWidth: 1,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 4,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typeChipText: {
        fontSize: 11,
        fontWeight: '600',
    },
    moodRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 8,
    },
    moodBtn: {
        padding: 6,
        borderRadius: 20,
    },
    moodEmoji: {
        fontSize: 18,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
