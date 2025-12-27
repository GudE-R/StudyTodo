import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { Todo } from "@pomarc/shared";

interface MobileDayScheduleProps {
    todos: Todo[];
}

export function MobileDaySchedule({ todos }: MobileDayScheduleProps) {
    // Filter tasks for today (or tasks that should appear on schedule)
    // For now, let's just show tasks with a dueTime, assuming they are for today for simplicity 
    // (Actual logic needs date comparison)
    const todayStr = new Date().toDateString();

    const scheduleItems = todos.filter(t => {
        if (!t.dueDate) return false;
        // Simple date check
        const isToday = new Date(t.dueDate).toDateString() === todayStr;
        return isToday && t.dueTime;
    });

    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

    const getTaskStyle = (dueTime: string) => {
        // Simple vertical positioning logic
        const [h, m] = dueTime.split(':').map(Number);
        // hour row height is 40
        // relative top = (h - 7) * 40 + (m / 60) * 40
        const top = (h - 7) * 40 + (m / 60) * 40;
        return { top };
    };

    return (
        <View style={styles.container}>
            <View style={styles.timeline}>
                {hours.map(hour => (
                    <View key={hour} style={styles.hourRow}>
                        <Text style={styles.timeLabel}>{hour}:00</Text>
                        <View style={styles.timeSlot} />
                    </View>
                ))}

                {/* Render Events */}
                {scheduleItems.map(item => {
                    if (!item.dueTime) return null;
                    const top = getTaskStyle(item.dueTime).top;
                    return (
                        <View key={item.id} style={[styles.eventItem, { top: top }]}>
                            <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.eventTime}>{item.dueTime}</Text>
                        </View>
                    );
                })}
            </View>
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
    },
    timeline: {
        position: 'relative',
    },
    eventItem: {
        position: 'absolute',
        left: 50, // After time label
        right: 10,
        height: 35, // Fixed height for now
        backgroundColor: '#E3F2FD',
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        justifyContent: 'center',
        opacity: 0.9,
    },
    eventTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1565C0',
    },
    eventTime: {
        fontSize: 10,
        color: '#555',
    }
});
