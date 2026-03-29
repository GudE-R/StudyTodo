import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Svg, Rect, Text as SvgText, G, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../providers/ThemeProvider';
import { Range } from '../../hooks/useActivityAnalytics';

interface ActivityChartsProps {
    chartData: { label: string; value: number; date?: Date }[];
    pieData: { name: string; value: number; color: string }[];
    range: Range;
}

const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
};

export const ActivityCharts = ({ chartData, pieData, range }: ActivityChartsProps) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { width } = useWindowDimensions();

    const BarChartComponent = () => {
        const itemWidth = range === 'month' ? 35 : (width - 60) / chartData.length;
        const totalContentWidth = Math.max(width - 60, itemWidth * chartData.length);
        const barWidth = itemWidth * 0.6;
        const maxVal = Math.max(...chartData.map(d => d.value), 10);
        const chartHeight = 150;

        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ height: 200, marginTop: 10, width: totalContentWidth }}>
                    <Svg height="100%" width="100%">
                        {chartData.map((d, i) => {
                            const barHeight = (d.value / maxVal) * chartHeight;
                            const x = i * itemWidth + (itemWidth - barWidth) / 2;
                            const y = chartHeight - barHeight + 20;

                            return (
                                <G key={i}>
                                    <Rect x={x} y={y} width={barWidth} height={barHeight} fill={colors.primary} rx={4} />
                                    <SvgText x={x + barWidth / 2} y={chartHeight + 40} fontSize="10" fill={colors.textSecondary} textAnchor="middle">{d.label}</SvgText>
                                    {d.value > 0 && (
                                        <SvgText x={x + barWidth / 2} y={y - 5} fontSize="10" fill={colors.textSecondary} textAnchor="middle">{Math.round(d.value)}</SvgText>
                                    )}
                                </G>
                            );
                        })}
                    </Svg>
                </View>
            </ScrollView>
        );
    };

    const PieChartComponent = () => {
        let cumulativePercent = 0;
        const total = pieData.reduce((acc, d) => acc + d.value, 0);

        if (total === 0) return <View style={styles.noDataContainer}><Text style={[styles.noDataText, { color: colors.textMuted }]}>No Data</Text></View>;

        return (
            <View style={styles.pieContainer}>
                <Svg height={160} width={160} viewBox="-1 -1 2 2" style={{ transform: [{ rotate: '-90deg' }] }}>
                    {pieData.map((slice, i) => {
                        const percent = slice.value / total;
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += percent;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                        const largeArcFlag = percent > .5 ? 1 : 0;
                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `L 0 0`,
                        ].join(' ');

                        return <Path key={i} d={pathData} fill={slice.color} />;
                    })}
                </Svg>
                <View style={styles.legendContainer}>
                    {pieData.slice(0, 5).map((d, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: d.color }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]} numberOfLines={1}>{d.name} ({Math.round(d.value)}m)</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <>
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>{t('activity.trend', 'Trend (min)')}</Text>
                <BarChartComponent />
            </View>
            <View style={[styles.chartCard, { marginTop: 15, backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>{t('activity.distribution', 'Distribution')}</Text>
                <PieChartComponent />
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    chartCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 15,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    pieContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    legendContainer: {
        flex: 1,
        marginStart: 20,
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginEnd: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#64748b',
        flex: 1,
    },
    noDataContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        color: '#94a3b8',
    },
});
