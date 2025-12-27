import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings as SettingsIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

interface HeaderProps {
    date?: Date;
    onOpenSettings: () => void;
    onPrevDate?: () => void;
    onNextDate?: () => void;
}

export const Header = ({ onOpenSettings, onPrevDate, onNextDate, date = new Date() }: HeaderProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {/* Profile or Menu could go here, for now empty or minimal */}
            </View>

            <View style={styles.centerContainer}>
                <TouchableOpacity onPress={onPrevDate} style={styles.navBtn}>
                    <ChevronLeft size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.dateText}>{format(date, 'M月d日(EEE)', { locale: ja })}</Text>

                <TouchableOpacity onPress={onNextDate} style={styles.navBtn}>
                    <ChevronRight size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn}>
                <SettingsIcon size={20} color="#555" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Let's keep it compact but usable. 44px is standard.
        height: 44,
        flexDirection: 'row',
        backgroundColor: '#fff',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#eee',
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
