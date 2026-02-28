import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Todo, Category, generateId } from '@studytodo/shared';
import { useMobileTodos } from './useMobileTodos';
import { useMobileSRS } from './useMobileSRS';
import { useMobileSessions } from './useMobileSessions';

interface UseTodoCreateFormProps {
    visible: boolean;
    categories: Category[];
    initialDate?: Date;
    initialTime?: string;
    onClose: () => void;
    onStartNow?: (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => void;
}

export function useTodoCreateForm({
    visible, categories, initialDate, initialTime, onClose, onStartNow
}: UseTodoCreateFormProps) {
    const { t } = useTranslation();
    const { addTodo, addRoutineTodos, addSRSTodos } = useMobileTodos();
    const { profiles: srsProfiles } = useMobileSRS();
    const { addSession } = useMobileSessions();

    // States
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [srsProfileId, setSrsProfileId] = useState('');
    const [duration, setDuration] = useState('');
    const [isRecordMode, setIsRecordMode] = useState(false);
    const [routineDays, setRoutineDays] = useState<number[]>([]);
    const [isRoutineOpen, setIsRoutineOpen] = useState(false);

    // Picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showSRSPicker, setShowSRSPicker] = useState(false);

    // Initialize on open
    useEffect(() => {
        setDueDate(initialDate || null);
        setDueTime(initialTime || '');
        setEndTime('');
        setDuration('');
        setIsRecordMode(false);
    }, [visible, initialDate, initialTime]);

    // Flatten categories
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

    // Computed
    const selectedCategoryLabel = categoryOptions.find(c => c.value === categoryId)?.label || t('todo.noCategory', 'No Category');
    const selectedSrsName = srsProfiles.find(p => p.id === srsProfileId)?.name || '';

    // --- Helpers ---

    const parseContent = () => {
        const lines = content.split('\n');
        const rawTitle = lines[0].trim();
        const notes = lines.slice(1).join('\n').trim();

        let effectiveTitle = rawTitle;
        if (!effectiveTitle && categoryId) {
            const cat = categoryOptions.find(c => c.value === categoryId);
            if (cat) effectiveTitle = cat.label.split(' > ').pop() || cat.label;
        }

        return { title: effectiveTitle || '', notes: notes || undefined };
    };

    const isValid = () => {
        const rawTitle = content.split('\n')[0].trim();
        return rawTitle.length > 0 || categoryId.length > 0;
    };

    const ensureDateIfTimeSet = (): Date | undefined => {
        if (dueTime && !dueDate) return new Date();
        return dueDate ?? undefined;
    };

    const buildTodoData = (): Omit<Todo, 'id' | 'createdAt' | 'completed'> => {
        const { title, notes } = parseContent();
        let effectiveDate = dueTime ? ensureDateIfTimeSet() : (dueDate ?? undefined);

        if (!effectiveDate && (srsProfileId || routineDays.length > 0)) {
            effectiveDate = new Date();
        }

        return {
            title: title || '無題',
            dueDate: effectiveDate,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            categoryId: categoryId || undefined,
            srsProfileId: srsProfileId || undefined,
            srsInterval: selectedSrsName || undefined,
            memo: notes,
            priority: 'medium',
            routineDays: routineDays.length > 0 ? routineDays : undefined,
            updatedAt: new Date(),
        };
    };

    const resetForm = () => {
        setContent('');
        setDueDate(null);
        setDueTime('');
        setEndTime('');
        setCategoryId('');
        setSrsProfileId('');
        setRoutineDays([]);
        setIsRoutineOpen(false);
        setDuration('');
        setIsRecordMode(false);
        onClose();
    };

    // --- Handlers ---

    const handleCreate = async () => {
        if (!isValid()) {
            Alert.alert(t('common.error', 'Error'), t('todo.inputTitleOrCategory', 'Please enter a title or select a category'));
            return;
        }
        const todoData = buildTodoData();

        if (routineDays.length > 0) {
            await addRoutineTodos(
                { ...todoData, id: generateId(), createdAt: new Date(), completed: false } as Todo,
                routineDays
            );
        } else if (srsProfileId) {
            const profile = srsProfiles.find(p => p.id === srsProfileId);
            const intervals = profile?.intervals || [1, 3, 7];
            await addSRSTodos(
                { ...todoData, id: generateId(), createdAt: new Date(), completed: false } as Todo,
                intervals
            );
        } else {
            await addTodo({ ...todoData, id: generateId(), createdAt: new Date(), completed: false });
        }
        resetForm();
    };

    const handleStartNow = () => {
        if (!isValid()) {
            Alert.alert(t('common.error', 'Error'), t('todo.inputTitleOrCategory', 'Please enter a title or select a category'));
            return;
        }
        const { title, notes } = parseContent();
        const now = new Date();
        const todoData: Omit<Todo, 'id' | 'createdAt' | 'completed'> = {
            title: title || t('todo.noTitle', 'Untitled'),
            dueDate: now,
            dueTime: format(now, 'HH:mm'),
            categoryId: categoryId || undefined,
            srsProfileId: srsProfileId || undefined,
            memo: notes,
            priority: 'medium',
            updatedAt: new Date(),
        };

        if (srsProfileId) {
            todoData.srsGroupId = generateId();
        }

        if (onStartNow) {
            onStartNow(todoData);
        }
        resetForm();
    };

    const handleRecord = async () => {
        if (!isValid()) {
            Alert.alert(t('common.error', 'Error'), t('todo.inputTitleOrCategory', 'Please enter a title or select a category'));
            return;
        }
        const durationNum = parseInt(duration, 10) || 0;
        const baseData = buildTodoData();
        const newTodo: Todo = {
            ...baseData,
            id: generateId(),
            createdAt: new Date(),
            completed: true,
        };

        await addTodo(newTodo);

        if (durationNum > 0) {
            await addSession({
                id: generateId(),
                todoId: newTodo.id,
                startTime: new Date(Date.now() - durationNum * 60000),
                endTime: new Date(),
                duration: durationNum * 60,
                todoTitle: newTodo.title,
                mode: 'pomodoro',
                createdAt: new Date(),
            });
        }

        resetForm();
    };

    return {
        // Data
        srsProfiles,
        categoryOptions,
        selectedCategoryLabel,
        selectedSrsName,

        // Form state
        content, setContent,
        dueDate, setDueDate,
        dueTime, setDueTime,
        endTime, setEndTime,
        categoryId, setCategoryId,
        srsProfileId, setSrsProfileId,
        duration, setDuration,
        isRecordMode, setIsRecordMode,
        routineDays, setRoutineDays,
        isRoutineOpen, setIsRoutineOpen,

        // Picker state
        showDatePicker, setShowDatePicker,
        showTimePicker, setShowTimePicker,
        showDurationPicker, setShowDurationPicker,
        showCategoryPicker, setShowCategoryPicker,
        showSRSPicker, setShowSRSPicker,

        // Handlers
        handleCreate,
        handleStartNow,
        handleRecord,
        resetForm,
    };
}
