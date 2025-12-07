export interface Todo {
    id: string;
    title: string;
    dueDate?: Date;
    dueTime?: string;
    endTime?: string;
    category?: string;
    srsInterval?: string;
    range?: string;
    memo?: string;
    priority?: "high" | "medium" | "low";
    completed: boolean;
    createdAt: Date;
}

export interface Category {
    id: string;
    name: string;
    level: "large" | "medium" | "small";
    parentId?: string;
    children?: Category[];
}

export interface SRSProfile {
    id: string;
    name: string;
    intervals: number[]; // Days until next review (e.g., [1, 3, 7])
    isDefault?: boolean;
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
