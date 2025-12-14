import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export function MobileCalendar() {
    // Simple calendar grid placeholder
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // detailed logic omitted for brevity

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.month}>December 2025</Text>
            </View>
            <View style={styles.grid}>
                {days.map(day => (
                    <Text key={day} style={styles.dayLabel}>{day}</Text>
                ))}
                {Array.from({ length: 31 }, (_, i) => (
                    <TouchableOpacity key={i} style={styles.cell}>
                        <Text style={[styles.dateText, i === 13 && styles.today]}>{i + 1}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    header: {
        alignItems: "center",
        marginBottom: 10,
    },
    month: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayLabel: {
        width: "14.28%", // 100% / 7
        textAlign: "center",
        fontSize: 12,
        color: "#999",
        marginBottom: 5,
    },
    cell: {
        width: "14.28%",
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    dateText: {
        fontSize: 14,
        color: "#333",
    },
    today: {
        color: "#007AFF",
        fontWeight: "bold",
    }
});
