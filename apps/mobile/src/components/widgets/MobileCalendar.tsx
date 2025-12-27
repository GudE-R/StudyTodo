import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Todo } from "@pomarc/shared";

interface MobileCalendarProps {
    isExpanded: boolean;
    todos: Todo[];
}

export function MobileCalendar({ isExpanded, todos }: MobileCalendarProps) {
    // 3-Week View (Default) vs 1-Month View (Expanded)
    const weeks = isExpanded ? ["W1", "W2", "W3", "W4", "W5"] : ["Previous", "Current", "Next"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Helper to check if a date has tasks
    const hasTaskOnDate = (dateOffset: number) => {
        // Mock date calculation for this prototype
        // In real app, we'd use a date library like date-fns
        const d = new Date();
        d.setDate(d.getDate() + dateOffset);
        const dateStr = d.toDateString();
        return todos.some(t => t.dueDate && new Date(t.dueDate).toDateString() === dateStr);
    };

    const renderWeek = (weekLabel: string, index: number) => (
        <View key={weekLabel} style={styles.weekRow}>
            {days.map((d, i) => {
                const dayOffset = (index * 7) + i; // Very rough mock offset
                const hasTask = hasTaskOnDate(dayOffset - 10); // adjusting mock offset to align somewhat with "today"

                return (
                    <View key={i} style={styles.dayCell}>
                        <Text style={[styles.dateText, weekLabel === "Current" && d === "Wed" && styles.todayText]}>
                            {/* Mock numbers: Start from 10th for demo */}
                            {10 + i + (index * 7)}
                        </Text>
                        {hasTask && <View style={styles.dot} />}
                    </View>
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.month}>
                    December 2025 {isExpanded ? "(Full Month)" : "(3 Weeks)"}
                </Text>
            </View>
            <View style={styles.headerRow}>
                {days.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
            </View>
            <View style={styles.weeksContainer}>
                {weeks.map((week, index) => renderWeek(week, isExpanded ? index : index - 1))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 5,
    },
    header: {
        alignItems: "center",
        marginBottom: 5,
    },
    month: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 2,
    },
    dayHeader: {
        fontSize: 10,
        color: "#999",
        width: 30,
        textAlign: "center",
    },
    weeksContainer: {
        flex: 1,
        justifyContent: "space-between",
    },
    weekRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 5,
    },
    dayCell: {
        width: 30,
        height: 35,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    dateText: {
        fontSize: 14,
        color: "#333",
    },
    todayText: {
        color: "blue",
        fontWeight: "bold",
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "orange",
        marginTop: 2,
    }
});
