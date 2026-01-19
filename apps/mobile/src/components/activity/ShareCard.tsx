import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { Svg, Rect, Path, Circle } from 'react-native-svg';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { Session, Todo, Category } from '@pomarc/shared';
import { Flame, Trophy, Clock, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../providers/ThemeProvider';

interface ShareCardProps {
    sessions: Session[];
    todos: Todo[];
    categories: Category[];
    streak: { currentStreak: number; longestStreak: number };
    userName?: string;
    totalDuration: number; // in minutes
    completedCount: number;
}

const WIDTH = 340; // Fixed width for sharing
const HEIGHT = 480;

export const ShareCard = ({
    sessions,
    todos,
    categories,
    streak,
    userName = "PomArc User",
    totalDuration,
    completedCount
}: ShareCardProps) => {
    // Force light mode for the share card to ensure consistent look
    // or adapt to current theme. Web version uses white bg.
    // Let's stick to a specific "Card Theme" that looks good in export.
    const colors = {
        background: '#ffffff',
        text: '#111827',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',
        border: '#e5e7eb',
        primary: '#3b82f6',
        surface: '#f9fafb',
        surfaceHighlight: '#f3f4f6',
        success: '#22c55e',
        orange: '#f97316',
        orangeBg: '#fff7ed',
        orangeBorder: '#ffedd5',
        yellow: '#eab308',
        yellowBg: '#fefce8',
        yellowBorder: '#fef9c3',
    };

    const today = new Date();
    const { t } = useTranslation();
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;

    // --- Heatmap Data (Last 14 days) ---
    const growthTrackDays = useMemo(() => eachDayOfInterval({
        start: subDays(today, 13),
        end: today
    }), [today]);

    // --- Pie Chart Data ---
    const pieData = useMemo(() => {
        const distribution: { [key: string]: { name: string, value: number, color: string } } = {};

        // Filter sessions for relevant timeframe? 
        // Web implementation uses ALL sessions passed to it. Assuming 'sessions' prop is already filtered if needed.
        // But usually ShareCard shows overall or filtered stats.
        // Let's assume sessions passed are what we want to analyze.

        sessions.forEach(session => {
            const todo = todos.find(t => t.id === session.todoId);
            const catId = todo?.categoryId || "none";

            // Find category
            let category: Category | undefined;
            const findCat = (cats: Category[]): Category | undefined => {
                for (const c of cats) {
                    if (c.id === catId) return c;
                    if (c.children) {
                        const found = findCat(c.children);
                        if (found) return found;
                    }
                }
                return undefined;
            };
            category = findCat(categories);

            const name = category?.name || (catId === "none" ? "No Category" : "Unknown");
            const color = category?.color || "#9ca3af";

            if (!distribution[catId]) distribution[catId] = { name, value: 0, color };
            distribution[catId].value += session.duration / 60; // minutes
        });

        return Object.values(distribution).sort((a, b) => b.value - a.value);
    }, [sessions, todos, categories]);

    const totalPieValue = pieData.reduce((acc, d) => acc + d.value, 0);

    // --- Helper for Donut ---
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    let cumulativePercent = 0;

    return (
        <View style={[styles.card, { width: WIDTH, height: HEIGHT, backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.appInfo}>
                    <View style={styles.logoBadge}>
                        <Text style={styles.logoText}>P</Text>
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>PomArc</Text>
                </View>
                <Text style={[styles.date, { color: colors.textSecondary }]}>{format(today, "yyyy.MM.dd")}</Text>
            </View>

            {/* Streak Badges */}
            <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: colors.orangeBg, borderColor: colors.orangeBorder }]}>
                    <Flame size={16} color={colors.orange} />
                    <Text style={[styles.badgeText, { color: '#c2410c' }]}>{t('share.streak', { count: streak.currentStreak, defaultValue: `${streak.currentStreak} Days Streak` })}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.yellowBg, borderColor: colors.yellowBorder }]}>
                    <Trophy size={16} color="#ca8a04" />
                    <Text style={[styles.badgeText, { color: '#a16207' }]}>{t('share.bestStreak', { count: streak.longestStreak, defaultValue: `Best ${streak.longestStreak} Days` })}</Text>
                </View>
            </View>

            {/* Main Stats */}
            <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight }]}>
                <View style={styles.statBox}>
                    <View style={styles.statLabelRow}>
                        <Clock size={12} color={colors.textSecondary} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('share.totalTime', 'Total Time')}</Text>
                    </View>
                    <View style={styles.statValueRow}>
                        {hours > 0 && (
                            <>
                                <Text style={[styles.statValueBig, { color: colors.primary }]}>{hours}</Text>
                                <Text style={[styles.statUnit, { color: colors.textSecondary }]}>h</Text>
                            </>
                        )}
                        <Text style={[styles.statValueBig, { color: colors.primary }]}>{minutes}</Text>
                        <Text style={[styles.statUnit, { color: colors.textSecondary }]}>m</Text>
                    </View>
                </View>
                <View style={styles.statBox}>
                    <View style={styles.statLabelRow}>
                        <CheckCircle size={12} color={colors.textSecondary} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('share.completed', 'Completed')}</Text>
                    </View>
                    <View style={styles.statValueRow}>
                        <Text style={[styles.statValueBig, { color: colors.success }]}>{completedCount}</Text>
                        <Text style={[styles.statUnit, { color: colors.textSecondary }]}>{t('share.tasks', 'tasks')}</Text>
                    </View>
                </View>
            </View>

            {/* Charts Row */}
            <View style={styles.chartsContainer}>
                {/* Heatmap (Left) */}
                <View style={styles.chartCol}>
                    <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>{t('share.last14Days', 'Last 14 Days')}</Text>
                    <View style={styles.heatmapGrid}>
                        {growthTrackDays.map((day, i) => {
                            const hasActivity = sessions.some(s => isSameDay(new Date(s.createdAt), day));
                            const isToday = isSameDay(day, today);
                            // 7 cols, 2 rows? Web logic: map index 0-13.
                            // If we want 2 rows of 7:
                            // Row 1: 0-6, Row 2: 7-13.

                            return (
                                <View key={i} style={[
                                    styles.heatmapCell,
                                    {
                                        backgroundColor: hasActivity ? colors.success : colors.surfaceHighlight,
                                        borderColor: isToday ? colors.primary : hasActivity ? colors.success : '#e5e7eb'
                                    },
                                    isToday && { borderWidth: 1 }
                                ]} />
                            );
                        })}
                    </View>
                    {/* Simple day labels for last row? */}
                    <View style={styles.heatmapLabels}>
                        {growthTrackDays.slice(7).map((d, i) => (
                            <Text key={i} style={[styles.heatmapDayText, isSameDay(d, today) && { color: colors.primary }]}>
                                {format(d, 'EEEEE')}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Pie Chart (Right) */}
                <View style={styles.chartCol}>
                    <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>{t('share.distribution', 'Distribution')}</Text>
                    <View style={styles.pieWrapper}>
                        {totalPieValue > 0 ? (
                            <Svg height={80} width={80} viewBox="-1 -1 2 2" style={{ transform: [{ rotate: '-90deg' }] }}>
                                {pieData.map((slice, i) => {
                                    const percent = slice.value / totalPieValue;
                                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                                    cumulativePercent += percent;
                                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                                    const largeArcFlag = percent > .5 ? 1 : 0;

                                    // Donut hole will be handled by overlaying a circle or path?
                                    // Let's just draw pie slices for now, keeping it simple like Web's ShareCard using separate paths.
                                    // Actually Web's ShareCard creates a donut by adding a small white circle in middle.

                                    const pathData = [
                                        `M ${startX} ${startY}`,
                                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                        `L 0 0`,
                                    ].join(' ');

                                    return <Path key={i} d={pathData} fill={slice.color} />;
                                })}
                                <Circle cx="0" cy="0" r="0.6" fill={colors.background} />
                            </Svg>
                        ) : (
                            <Text style={{ fontSize: 10, color: colors.textMuted }}>{t('share.noData', 'No Data')}</Text>
                        )}

                        {/* Legend (Top 2) */}
                        <View style={styles.legend}>
                            {pieData.slice(0, 2).map((d, i) => (
                                <View key={i} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                                    <Text numberOfLines={1} style={[styles.legendText, { color: colors.textSecondary }]}>{d.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.surfaceHighlight }]}>
                <View style={styles.footerUser}>
                    <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{userName.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={[styles.footerUserName, { color: colors.text }]}>{userName}</Text>
                        <Text style={[styles.footerUrl, { color: colors.textMuted }]}>pomarc.app</Text>
                    </View>
                </View>
                <View>
                    <Text style={[styles.footerTagline, { color: colors.textMuted }]}>Visualize Progress.</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    appInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 14,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValueBig: {
        fontSize: 32,
        fontWeight: '900',
    },
    statUnit: {
        fontSize: 14,
        marginLeft: 2,
        marginRight: 6,
    },
    chartsContainer: {
        flexDirection: 'row',
        flex: 1,
        gap: 16,
    },
    chartCol: {
        flex: 1,
    },
    chartTitle: {
        fontSize: 10,
        marginBottom: 8,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        width: '100%', // 7 items * width + gaps
    },
    heatmapCell: {
        width: 16,
        height: 16,
        borderRadius: 2,
    },
    heatmapLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingRight: 4, // adjustment
    },
    heatmapDayText: {
        fontSize: 8,
        color: '#9ca3af',
        width: 16,
        textAlign: 'center',
    },
    pieWrapper: {
        alignItems: 'center',
    },
    legend: {
        marginTop: 8,
        width: '100%',
        gap: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    legendText: {
        fontSize: 8,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 16,
        marginTop: 16,
    },
    footerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footerUserName: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    footerUrl: {
        fontSize: 10,
    },
    footerTagline: {
        fontSize: 10,
    }
});
