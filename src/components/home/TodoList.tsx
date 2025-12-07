import React from "react";
import { Circle } from "lucide-react";
import { Todo, Category } from "@/types";

interface TodoListProps {
    todos: Todo[];
    categories?: Category[]; // Added categories prop
}

/**
 * Todoリストコンポーネント
 * 
 * ホーム画面左カラムに表示されるタスク一覧です。
 * 完了/未完了の切り替えや詳細表示への遷移を想定しています。
 */
export function TodoList({ todos, categories = [] }: TodoListProps) {
    // Helper to find category name
    const getCategoryName = (categoryId?: string) => {
        if (!categoryId) return null;
        // Flatten categories for search (or simple search if we assume flat list passed? No, page passes tree)
        // Actually, let's do a simple recursive search or assume we can pass flat list.
        // page.tsx passes tree.
        const findCat = (cats: Category[]): string | undefined => {
            for (const cat of cats) {
                if (cat.id === categoryId) return cat.name;
                if (cat.children) {
                    const found = findCat(cat.children);
                    if (found) return found;
                }
            }
            return undefined;
        };
        return findCat(categories);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* ヘッダー領域 */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Todo</h3>
            </div>

            {/* タスクリスト領域（スクロール可能） */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {todos.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">
                        タスクがありません
                    </div>
                ) : (
                    todos.map((todo) => {
                        const categoryName = getCategoryName(todo.categoryId);
                        return (
                            <div key={todo.id} className="flex items-start p-2 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                                {/* 完了チェックボタン */}
                                <button className="mt-0.5 text-gray-300 hover:text-blue-500">
                                    <Circle size={18} />
                                </button>

                                {/* タスク内容 */}
                                <div className="ml-2 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{todo.title}</p>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        {todo.dueTime && (
                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {todo.dueTime}
                                            </span>
                                        )}
                                        {categoryName && (
                                            <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                                {categoryName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
