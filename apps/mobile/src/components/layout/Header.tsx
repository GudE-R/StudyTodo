import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings as SettingsIcon, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale'; // Keep for type or fallback? Not needed if using getDateFnsLocale
import { useThemeColors } from '../../providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    date?: Date;
    onOpenSettings: () => void;
    onOpenFeedback: () => void;
    onPrevDate?: () => void;
    onNextDate?: () => void;
}

import { getDateFnsLocale } from '../../lib/date-fns-locales';

export const Header = ({ onOpenSettings, onOpenFeedback, onPrevDate, onNextDate, date = new Date() }: HeaderProps) => {
    const { colors } = useThemeColors();
    const { t, i18n } = useTranslation();
    const safeDate = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();

    const locale = getDateFnsLocale(i18n.language);
    const formattedDate = format(safeDate, t('common.dateFormat', 'MMM d (EEE)'), { locale });

    return (
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.leftContainer} />

            <View style={styles.centerContainer}>
                <TouchableOpacity onPress={onPrevDate} style={styles.navBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.dateText, { color: colors.text }]}>{formattedDate}</Text>

                <TouchableOpacity onPress={onNextDate} style={styles.navBtn}>
                    <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.rightContainer}>
                <TouchableOpacity onPress={onOpenFeedback} style={styles.iconBtn}>
                    <MessageSquare size={20} color={colors.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onOpenSettings} style={styles.iconBtn}>
                    <SettingsIcon size={20} color={colors.icon} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 44,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: 10,
    },
    leftContainer: {
        width: 40,
    },
    centerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    navBtn: {
        padding: 4,
    },
    dateText: {
        fontWeight: 'bold',
        fontSize: 16,
        minWidth: 100,
        textAlign: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 8,
    }
});

