export interface Todo {
    id: string;
    title: string;
    dueDate?: Date;
    dueTime?: string;
    endTime?: string;
    categoryId?: string; // Changed from category name to ID
    srsInterval?: string;
    range?: string;
    memo?: string;
    priority?: "high" | "medium" | "low";
    completed: boolean;
    createdAt: Date;
    updatedAt: Date; // Added
    srsGroupId?: string; // ID of the original Todo (Cascade Delete key)
}

export interface Category {
    id: string;
    name: string;
    level: "large" | "medium" | "small";
    parentId?: string;
    children?: Category[]; // For UI tree structure
    icon?: string; // Lucide icon name (e.g., "Book", "Code", "Music")
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
    createdAt: Date;
    mode: "pomodoro" | "countdown" | "stopwatch";
}
