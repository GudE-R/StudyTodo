import React from "react";
import { Circle } from "lucide-react";
import { Todo } from "@/types";

interface TodoListProps {
    todos: Todo[];
}

/**
 * Todoリストコンポーネント
 * 
 * ホーム画面左カラムに表示されるタスク一覧です。
 * 完了/未完了の切り替えや詳細表示への遷移を想定しています。
 */
export function TodoList({ todos }: TodoListProps) {
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
                    todos.map((todo) => (
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
                                    {todo.category && (
                                        <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                            {todo.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
