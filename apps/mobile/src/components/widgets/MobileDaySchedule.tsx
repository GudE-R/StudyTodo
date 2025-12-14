import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function MobileDaySchedule() {
    // Placeholder for schedule view
    // In future: SVG timeline or list of events
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

    return (
        <View style={styles.container}>
            {hours.map(hour => (
                <View key={hour} style={styles.hourRow}>
                    <Text style={styles.timeLabel}>{hour}:00</Text>
                    <View style={styles.timeSlot} />
                </View>
            ))}
            <Text style={styles.note}>Schedule visualization coming soon...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },
    hourRow: {
        flexDirection: "row",
        height: 40,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    timeLabel: {
        width: 50,
        fontSize: 12,
        color: "#999",
        textAlign: "right",
        paddingRight: 10,
    },
    timeSlot: {
        flex: 1,
        height: "100%",
        backgroundColor: "transparent", // Events would be absolutely positioned here
    },
    note: {
        marginTop: 20,
        textAlign: "center",
        color: "#ccc",
        fontStyle: "italic",
    }
});
