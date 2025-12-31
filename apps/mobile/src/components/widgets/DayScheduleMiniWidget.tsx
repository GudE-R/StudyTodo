import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { Todo, getTodoScheduleRange } from "@pomarc/shared";

interface DayScheduleMiniWidgetProps {
    todos: Todo[];
}

export function DayScheduleMiniWidget({ todos }: DayScheduleMiniWidgetProps) {
    // Filter tasks for today (or tasks that should appear on schedule)
    // For now, let's just show tasks with a dueTime, assuming they are for today for simplicity 
    // (Actual logic needs date comparison)
    const todayStr = new Date().toDateString();

    const scheduleItems = todos.map(t => {
        if (!t.dueDate) return null;
        // Safe date check
        const dueDateObj = new Date(t.dueDate);
        if (isNaN(dueDateObj.getTime())) return null;
        const isToday = dueDateObj.toDateString() === todayStr;
        if (!isToday) return null;

        const schedule = getTodoScheduleRange(t);
        if (!schedule) return null;

        return { ...t, schedule };
    }).filter((t): t is (Todo & { schedule: { start: number, end: number } }) => t !== null);

    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
    const startHourOffset = 7;
    const hourHeight = 40;

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
                    const { start: startMinutes } = item.schedule;

                    // Display Start Time String
                    const h = Math.floor(startMinutes / 60);
                    const m = startMinutes % 60;
                    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                    // Calculate top (relative to 7 AM)
                    // If start time is before 7 AM, it might appear off-screen or negative top (clip it?)
                    // For simply logic, just calculate.
                    const relativeMinutes = startMinutes - (startHourOffset * 60);
                    const top = (relativeMinutes / 60) * hourHeight;

                    // Skip if out of view (before 7 AM or after 9 PM + 1h ?)
                    if (relativeMinutes < 0) return null; // Or show at 0 if wanted

                    return (
                        <View key={item.id} style={[styles.eventItem, { top: top }]}>
                            <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.eventTime}>{timeStr}</Text>
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
