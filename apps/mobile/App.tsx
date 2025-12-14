
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RepositoryProvider } from './src/providers/RepositoryProvider';
import { useThemeColors } from './src/hooks/useThemeColors';
import { Todo } from '@pomarc/shared';

// UI Components
import { Header } from './src/components/ui/Header';
import { BottomActions } from './src/components/ui/BottomActions';
import { MobileTodoCreateModal } from './src/components/todo/MobileTodoCreateModal';
import { TimerModal } from './src/components/timer/TimerModal';

// Widgets
import { TodoListWidget } from './src/components/widgets/TodoListWidget';
import { DayScheduleWidget } from './src/components/widgets/DayScheduleWidget';
import { CalendarWidget } from './src/components/widgets/CalendarWidget';

// Logic Hooks
import { useMobileTodos } from './src/hooks/useMobileTodos';
import { useMobileSessions } from './src/hooks/useMobileSessions';

function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeTodo, setActiveTodo] = useState<Todo | undefined>(undefined);
  const [isTimerVisible, setTimerVisible] = useState(false);

  const { todos, refreshTodos, addTodo, updateTodo } = useMobileTodos();
  const { sessions, refreshSessions, addSession } = useMobileSessions();

  // Initial Data Load
  useEffect(() => {
    refreshTodos();
    refreshSessions();
  }, [refreshTodos, refreshSessions]);

  const handlePlayTodo = (todo: Todo) => {
    setActiveTodo(todo);
    setTimerVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <View style={styles.mainContent}>

        {/* Split View: TodoList (Left) & DaySchedule (Right) */}
        <View style={styles.splitViewContainer}>
          <View style={styles.leftColumn}>
            <TodoListWidget
              todos={todos}
              selectedDate={selectedDate}
              onToggleTodo={(id, completed) => updateTodo(id, { completed })}
              onPlayTodo={handlePlayTodo}
            />
          </View>
          <View style={styles.rightColumn}>
            <DayScheduleWidget
              todos={todos}
              selectedDate={selectedDate}
            />
          </View>
        </View>

        {/* Calendar (Below) */}
        <View style={styles.calendarContainer}>
          <CalendarWidget
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            todos={todos}
            sessions={sessions}
          />
        </View>

      </View>

      {/* Footer / Bottom Actions */}
      <BottomActions onAddPress={() => setModalVisible(true)} />

      {/* Todo Create Modal */}
      <MobileTodoCreateModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTodo}
      />

      {/* Timer Modal */}
      <TimerModal
        visible={isTimerVisible}
        onClose={() => setTimerVisible(false)}
        todo={activeTodo}
        onSaveSession={async (session) => {
          await addSession(session);
          // Optionally auto-complete todo or refresh
        }}
      />

    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RepositoryProvider>
        <HomeScreen />
      </RepositoryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  splitViewContainer: {
    flex: 1, // Takes up remaining space above calendar
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 1, // 50% width
    borderRightWidth: 1,
  },
  rightColumn: {
    flex: 1, // 50% width
  },
  calendarContainer: {
    borderTopWidth: 1,
  }
});
