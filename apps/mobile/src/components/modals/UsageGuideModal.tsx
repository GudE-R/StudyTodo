import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ModalOverlay } from '../ui/ModalOverlay';
import { X, Play, Calendar, Clock, Repeat, FolderTree, Palette, Timer, BookOpen, MessageSquare, Share2, Cloud, Sparkles, Pin, PaintBucket } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../providers/ThemeProvider';

interface UsageGuideModalProps {
    visible: boolean;
    onClose: () => void;
}

export const UsageGuideModal = ({ visible, onClose }: UsageGuideModalProps) => {
    const { colors, isDark } = useThemeColors();
    const { t } = useTranslation();

    const guideCategories = [
        {
            title: t("guide.catIntro", "Introduction"),
            items: [
                { icon: MessageSquare, title: t("guide.feedbackTitle", "Feedback"), desc: t("guide.feedbackDesc", "Please send us your feedback.") }
            ]
        },
        {
            title: t("guide.catBasic", "Basic Usage"),
            items: [
                { icon: Play, title: t("guide.createTaskTitle", "Create Task"), desc: t("guide.createTaskDesc", "Tap + to create.") },
                { icon: Timer, title: t("guide.timerTitle", "Timer"), desc: t("guide.timerDesc", "Use Pomodoro, Countdown, or Stopwatch.") },
                { icon: Calendar, title: t("guide.calendarTitle", "Calendar"), desc: t("guide.calendarDesc", "Check your schedule.") }
            ]
        },
        {
            title: t("guide.catEfficiency", "Efficiency"),
            items: [
                { icon: Repeat, title: t("guide.srsTitle", "SRS"), desc: t("guide.srsDesc", "Spaced Repetition System.") },
                { icon: Clock, title: t("guide.routineTitle", "Routine"), desc: t("guide.routineDesc", "Set up weekly routines.") },
                { icon: Pin, title: t("guide.keepTitle", "Keep"), desc: t("guide.keepDesc", "Long press to keep date/time.") }
            ]
        },
        {
            title: t("guide.catReview", "Review & Share"),
            items: [
                { icon: BookOpen, title: t("guide.historyTitle", "History"), desc: t("guide.historyDesc", "Analyze your progress.") },
                { icon: Share2, title: t("guide.shareTitle", "Share"), desc: t("guide.shareDesc", "Share your achievements.") }
            ]
        },
        {
            title: t("guide.catOthers", "Others"),
            items: [
                { icon: FolderTree, title: t("guide.categoryTitle", "Categories"), desc: t("guide.categoryDesc", "Organize your tasks.") },
                { icon: Cloud, title: t("guide.syncTitle", "Cloud Sync"), desc: t("guide.syncDesc", "Sync data across devices.") },
                { icon: Palette, title: t("guide.themeTitle", "Theme"), desc: t("guide.themeDesc", "Light or Dark mode.") },
                { icon: PaintBucket, title: t("guide.catColorTitle", "Colors"), desc: t("guide.catColorDesc", "Color code your categories.") }
            ]
        }
    ];

    return (
        <ModalOverlay visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <BookOpen size={20} color={colors.primary} />
                            <Text style={[styles.title, { color: colors.text }]}>{t("guide.title", "Usage Guide")}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView contentContainerStyle={styles.content}>
                        {guideCategories.map((category, catIndex) => (
                            <View key={catIndex} style={styles.section}>
                                <View style={[styles.sectionHeader, { borderLeftColor: colors.primary }]}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        {category.title}
                                    </Text>
                                </View>
                                <View style={styles.itemsContainer}>
                                    {category.items.map((item, itemIndex) => {
                                        const Icon = item.icon;
                                        return (
                                            <View key={itemIndex} style={[styles.itemCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                                                <View style={styles.itemHeader}>
                                                    <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' }]}>
                                                        <Icon size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
                                                    </View>
                                                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                                                </View>
                                                <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                                                    {item.desc}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.primary }]}
                            onPress={onClose}
                        >
                            <Text style={styles.closeButtonText}>{t("common.close", "Close")}</Text>
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
        justifyContent: 'flex-end',
        padding: 0,
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        maxHeight: '90%',
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
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        paddingLeft: 12,
        borderLeftWidth: 4,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemsContainer: {
        gap: 12,
    },
    itemCard: {
        padding: 16,
        borderRadius: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 12,
    },
    iconBox: {
        padding: 8,
        borderRadius: 8,
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: 15,
        flex: 1,
    },
    itemDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 44, // Align with text (Icon size 20 + padding 8*2 + gap 12 roughly) -> 20+16+12 = 48. Let's try 44.
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    closeButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
