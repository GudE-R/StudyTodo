export interface Todo {
    id: string;
    title: string;
    dueDate?: Date | string; // Helper for serializing
    dueTime?: string | null;
    endTime?: string | null;
    categoryId?: string;

    // Duration & Notes
    estimatedDuration?: number; // minutes
    actualDuration?: number; // minutes
    notes?: string;
    tags?: string[];

    // SRS Fields
    srsLevel?: number;
    nextReviewDate?: Date | string;
    srsProfileId?: string;
    reviewHistory?: { date: string, correct: boolean }[];

    // Legacy/Web compat
    srsInterval?: string;
    range?: string;
    memo?: string;

    // Routine (Weekday repeat)
    routineDays?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday

    priority?: "high" | "medium" | "low";
    completed: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    srsGroupId?: string;
}

export interface Category {
    id: string;
    name: string;
    level: "large" | "medium" | "small";
    parentId?: string;
    children?: Category[]; // For UI tree structure
    icon?: string; // Lucide icon name (e.g., "Book", "Code", "Music")
    customIconUri?: string; // Custom image URI (local file path)
    color?: string; // HEX color (e.g., "#3b82f6")
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SRSProfile {
    id: string;
    name: string;
    intervals: number[]; // Days until next review (e.g., [1, 3, 7])
    isDefault?: boolean;
    createdAt: Date; // Added
    updatedAt: Date; // Added
}

/**
 * 学習セッションの記録
 */
export interface Session {
    id: string;
    todoId: string;
    todoTitle: string;
    duration: number; // 秒単位
    startTime?: Date | string;
    endTime?: Date | string;
    createdAt: Date;
    mode: "pomodoro" | "countdown" | "stopwatch";
}

/**
 * ジャーナル投稿（1人SNS）
 */
export interface JournalPost {
    id: string;
    content: string;
    type: 'note' | 'learning' | 'reflection' | 'milestone';
    mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
    tags?: string[];
    linkedTodoId?: string;
    linkedTodoTitle?: string;
    createdAt: string;
    updatedAt: string;
}

export interface JournalSettings {
    enabled: boolean;
    autoPromptOnComplete: boolean;
}

/**
 * ユーザーからのフィードバック
 */
export interface Feedback {
    id: string;
    userId?: string;
    content: string;
    type: "bug" | "request" | "other";
    deviceInfo?: string;
    version?: string;
    createdAt: Date | string;
}
