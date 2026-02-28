import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Todo, Category, parseTodoContent } from '@studytodo/shared';
import { useMobileCategories } from './useMobileCategories';
import { useMobileSRS } from './useMobileSRS';
import { useMobileSessions } from './useMobileSessions';
import { useMobileTodos } from './useMobileTodos';
import { addDays } from 'date-fns';

interface UseTodoDetailFormProps {
    visible: boolean;
    todo: Todo | null;
    onClose: () => void;
    onStartNow: (todo: Todo) => void;
    onDelete: (todoId: string) => void;
    onUpdate: (todo: Todo, options?: { applySrs?: boolean }) => void;
    onRecord: (todo: Todo, duration: number) => void;
}

export function useTodoDetailForm({
    visible, todo, onClose, onStartNow, onDelete, onUpdate, onRecord
}: UseTodoDetailFormProps) {
    const { t } = useTranslation();
    const { categories } = useMobileCategories();
    const { profiles: srsProfiles } = useMobileSRS();
    const { sessions } = useMobileSessions();
    const { updateRoutine } = useMobileTodos();

    // Edit States
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [srsInterval, setSrsInterval] = useState('');

    // Routine States
    const [routineDays, setRoutineDays] = useState<number[]>([]);
    const [isRoutineOpen, setIsRoutineOpen] = useState(false);

    // Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState('');

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
    const [isSRSPickerVisible, setIsSRSPickerVisible] = useState(false);

    // Flatten categories for selection logic
    const categoryOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        const traverse = (cats: Category[], prefix = '') => {
            cats.forEach(cat => {
                const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
                options.push({ value: cat.id, label });
                if (cat.children) traverse(cat.children, label);
            });
        };
        traverse(categories);
        return options;
    }, [categories]);

    // Initialize states when todo is opened
    useEffect(() => {
        if (todo && visible) {
            const initialContent = todo.memo ? `${todo.title}\n${todo.memo}` : (todo.title || '');
            setContent(initialContent);
            setCategoryId(todo.categoryId || '');
            setDueDate(todo.dueDate ? new Date(todo.dueDate) : null);
            setDueTime(todo.dueTime || '');
            setEndTime(todo.endTime || '');

            let initialSrsInterval = todo.srsInterval || '';
            if (!initialSrsInterval && todo.srsProfileId) {
                const profile = srsProfiles.find(p => p.id === todo.srsProfileId);
                if (profile) initialSrsInterval = profile.name;
            }
            setSrsInterval(initialSrsInterval);

            setIsRecording(false);
            setRecordDuration('');
            setRoutineDays(todo.routineDays || []);
            setIsRoutineOpen((todo.routineDays?.length || 0) > 0);
        }
    }, [todo, visible]);

    // Computed
    const todoSessions = useMemo(() => {
        if (!todo) return [];
        return sessions.filter(s => s.todoId === todo.id);
    }, [sessions, todo]);

    const totalMinutes = Math.floor(todoSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
    const selectedCategoryLabel = categoryOptions.find(c => c.value === categoryId)?.label || t('todo.noCategory', 'No Category');

    // --- Handlers ---

    const parseContent = () => {
        const cat = categoryOptions.find(c => c.value === categoryId);
        const fallbackTitle = cat ? (cat.label.split(' > ').pop() || cat.label) : undefined;
        return parseTodoContent(content, fallbackTitle, t('todo.noTitle', 'Untitled'));
    };

    const buildUpdatedTodo = (): Todo | null => {
        if (!todo) return null;
        const { title: parsedTitle, memo: parsedMemo } = parseContent();
        return {
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            srsInterval: srsInterval || undefined,
            routineDays: routineDays.length > 0 ? routineDays : undefined,
            updatedAt: new Date(),
        };
    };

    const handleUpdate = () => {
        if (!todo) return;
        const updated = buildUpdatedTodo();
        if (!updated) return;

        const performUpdate = () => {
            const durationNum = parseInt(recordDuration, 10);
            if (!isNaN(durationNum) && durationNum > 0) {
                onRecord(updated, durationNum * 60);
            } else {
                onUpdate(updated);
            }
            onClose();
        };

        // Routine Logic
        const oldRoutine = todo.routineDays || [];
        const isRoutineChanged =
            routineDays.length !== oldRoutine.length ||
            !routineDays.every(d => oldRoutine.includes(d));

        if (isRoutineChanged && routineDays.length > 0) {
            Alert.alert(
                t('guide.routineTitle', 'Routine'),
                t('todo.updateRoutineConfirm', 'Update routine schedule? This will regenerate tasks for next 30 days.'),
                [
                    { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                    {
                        text: t('common.update', 'Update'),
                        onPress: async () => {
                            await updateRoutine(updated, routineDays);
                            onClose();
                        }
                    }
                ]
            );
            return;
        }

        // SRS Logic
        if (srsInterval && srsInterval !== todo.srsInterval && srsInterval !== '') {
            Alert.alert(
                t('srs.confirmTitle', 'SRS Schedule'),
                t('srs.confirmGenerate', 'SRS profile changed. Generate review schedule?'),
                [
                    { text: t('common.no', 'No'), onPress: () => performUpdate() },
                    { text: t('common.yes', 'Yes'), onPress: () => { onUpdate(updated, { applySrs: true }); onClose(); } }
                ]
            );
        } else {
            performUpdate();
        }
    };

    const handleStartNow = () => {
        if (!todo) return;
        const { title: parsedTitle, memo: parsedMemo } = parseContent();
        onStartNow({
            ...todo,
            title: parsedTitle,
            memo: parsedMemo,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            srsInterval: srsInterval || undefined,
            updatedAt: new Date(),
        });
        onClose();
    };

    const handlePostpone = () => {
        if (!todo) return;
        const currentDate = dueDate || new Date();
        const nextDate = addDays(currentDate, 1);
        onUpdate({ ...todo, dueDate: nextDate, updatedAt: new Date() });
        onClose();
    };

    const handleDelete = () => {
        if (!todo) return;
        Alert.alert(
            t('todo.deleteTask', 'Delete Task'),
            t('todo.deleteConfirm', 'Are you sure?'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                { text: t('common.delete', 'Delete'), style: 'destructive', onPress: () => { onDelete(todo.id); onClose(); } },
            ]
        );
    };

    const handleRecordSubmit = () => {
        const updated = buildUpdatedTodo();
        if (!updated) return;

        const d = parseInt(recordDuration, 10);
        if (!isNaN(d) && d > 0) {
            onRecord(updated, d * 60);
        } else {
            onUpdate(updated);
        }

        setRecordDuration('');
        setIsRecording(false);
        onClose();
    };

    return {
        // Data
        categories,
        srsProfiles,
        categoryOptions,
        selectedCategoryLabel,
        todoSessions,
        totalMinutes,

        // Edit state
        content, setContent,
        dueDate, setDueDate,
        dueTime, setDueTime,
        endTime, setEndTime,
        categoryId, setCategoryId,
        srsInterval, setSrsInterval,
        routineDays, setRoutineDays,
        isRoutineOpen, setIsRoutineOpen,

        // Recording state
        isRecording, setIsRecording,
        recordDuration, setRecordDuration,

        // UI state
        showDatePicker, setShowDatePicker,
        showTimePicker, setShowTimePicker,
        showDurationPicker, setShowDurationPicker,
        isCategoryPickerVisible, setIsCategoryPickerVisible,
        isSRSPickerVisible, setIsSRSPickerVisible,

        // Handlers
        handleUpdate,
        handleStartNow,
        handlePostpone,
        handleDelete,
        handleRecordSubmit,
    };
}
