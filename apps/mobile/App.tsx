import React from "react";
import { StyleSheet, View, ScrollView, SafeAreaView, Text } from "react-native";
import { ExpandablePane } from "./src/components/ui/ExpandablePane";
import { RepositoryProvider } from "./src/providers/RepositoryProvider";
import { MobileTodoList } from "./src/components/widgets/MobileTodoList";
import { MobileDaySchedule } from "./src/components/widgets/MobileDaySchedule";
import { MobileCalendar } from "./src/components/widgets/MobileCalendar";
import { StatusBar } from "expo-status-bar";

function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>PomArc</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ExpandablePane title="Current Task" color="#E3F2FD">
          <Text>Timer and Task Details will go here</Text>
        </ExpandablePane>

        <ExpandablePane title="Today's Tasks" color="#F3E5F5">
          <MobileTodoList />
        </ExpandablePane>

        <ExpandablePane title="Schedule" color="#FFF3E0">
          <MobileDaySchedule />
        </ExpandablePane>

        <ExpandablePane title="Calendar" color="#E8F5E9">
          <MobileCalendar />
        </ExpandablePane>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <RepositoryProvider>
      <HomeScreen />
    </RepositoryProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2d3436",
  },
  date: {
    fontSize: 16,
    color: "#636e72",
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  }
});
