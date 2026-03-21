import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StickyNote, Lightbulb, Eye, Flag, Trash2, Link } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../providers/ThemeProvider';
import { JournalPost } from '@studytodo/shared';

interface JournalPostCardProps {
    post: JournalPost;
    onDelete: (id: string) => void;
}

const TYPE_CONFIG = {
    note: { icon: StickyNote, color: '#64748b' },
    learning: { icon: Lightbulb, color: '#f59e0b' },
    reflection: { icon: Eye, color: '#8b5cf6' },
    milestone: { icon: Flag, color: '#22c55e' },
} as const;

const MOOD_EMOJI: Record<string, string> = {
    great: '😄',
    good: '🙂',
    neutral: '😐',
    bad: '😞',
    terrible: '😢',
};

export const JournalPostCard = ({ post, onDelete }: JournalPostCardProps) => {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const config = TYPE_CONFIG[post.type] || TYPE_CONFIG.note;
    const Icon = config.icon;

    const createdAt = new Date(post.createdAt);
    const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const handleDelete = () => {
        Alert.alert(
            t('journal.deleteTitle', 'Delete Entry'),
            t('journal.deleteConfirm', 'Are you sure you want to delete this entry?'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                { text: t('common.delete', 'Delete'), style: 'destructive', onPress: () => onDelete(post.id) },
            ]
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconBadge, { backgroundColor: config.color + '20' }]}>
                        <Icon size={14} color={config.color} />
                    </View>
                    <Text style={[styles.typeLabel, { color: config.color }]}>
                        {t(`journal.type${post.type.charAt(0).toUpperCase() + post.type.slice(1)}`, post.type)}
                    </Text>
                    {post.mood && (
                        <Text style={styles.moodEmoji}>{MOOD_EMOJI[post.mood]}</Text>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                        {dateStr} {timeStr}
                    </Text>
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                        <Trash2 size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

            {/* Linked Todo */}
            {post.linkedTodoTitle && (
                <View style={[styles.linkedTodo, { backgroundColor: colors.surfaceHighlight }]}>
                    <Link size={12} color={colors.textSecondary} />
                    <Text style={[styles.linkedTodoText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {post.linkedTodoTitle}
                    </Text>
                </View>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <View style={styles.tagsRow}>
                    {post.tags.map((tag, i) => (
                        <Text key={i} style={[styles.tag, { color: colors.primary }]}>#{tag}</Text>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    moodEmoji: {
        fontSize: 14,
    },
    timestamp: {
        fontSize: 11,
    },
    deleteBtn: {
        padding: 4,
    },
    content: {
        fontSize: 14,
        lineHeight: 20,
    },
    linkedTodo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    linkedTodoText: {
        fontSize: 12,
        flex: 1,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    tag: {
        fontSize: 12,
        fontWeight: '500',
    },
});
