import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings as SettingsIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useThemeColors } from '../../providers/ThemeProvider';

interface HeaderProps {
    date?: Date;
    onOpenSettings: () => void;
    onPrevDate?: () => void;
    onNextDate?: () => void;
}

export const Header = ({ onOpenSettings, onPrevDate, onNextDate, date = new Date() }: HeaderProps) => {
    const { colors } = useThemeColors();
    const safeDate = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();
    const formattedDate = format(safeDate, 'M月d日(EEE)', { locale: ja });

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

            <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn}>
                <SettingsIcon size={20} color={colors.icon} />
            </TouchableOpacity>
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
    settingsBtn: {
        padding: 5,
        width: 40,
        alignItems: 'flex-end',
    }
});

