"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Circle, CheckCircle, GripVertical, PlayCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Todo, Category } from "@pomarc/shared";
import { TodoTitle } from "@/components/ui/TodoTitle";

interface TodoListProps {
    todos: Todo[];
    categories?: Category[];
    onTodoClick?: (todo: Todo) => void;
    onToggleComplete?: (todo: Todo) => void;
    onReorder?: (todoId: string, newIndex: number) => void;
    onStart?: (todo: Todo) => void;
}

/**
 * Todoリストコンポーネント
 * 
 * ドラッグ&ドロップで並び替え可能なタスク一覧です。
 * タップで詳細画面へ遷移、チェックで完了状態を切り替えます。
 */
export function TodoList({ todos, categories = [], onTodoClick, onToggleComplete, onReorder, onStart }: TodoListProps) {
    const t = useTranslations("common");
    // カテゴリ名を取得するヘルパー関数
    const getCategoryName = (categoryId?: string) => {
        if (!categoryId) return null;
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

    // ドラッグ終了時の処理
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !onReorder) return;
        if (result.source.index === result.destination.index) return;

        const todoId = result.draggableId;
        onReorder(todoId, result.destination.index);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* ヘッダー領域削除 (ExpandablePaneへ移動) */}

            {/* タスクリスト領域（スクロール可能） */}
            <div className="flex-1 overflow-y-auto p-2">
                {todos.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-xs">
                        {t("noTasks")}
                    </div>
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="todo-list">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-2"
                                >
                                    {todos.map((todo, index) => {
                                        const categoryName = getCategoryName(todo.categoryId);
                                        return (
                                            <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        onClick={() => onTodoClick?.(todo)}
                                                        className={`flex items-start p-2 bg-white dark:bg-gray-800 border rounded-lg shadow-sm transition-colors cursor-pointer
                                                            ${snapshot.isDragging
                                                                ? "border-blue-400 shadow-lg"
                                                                : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700"
                                                            }`}
                                                    >
                                                        {/* ドラッグハンドル */}
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="mr-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <GripVertical size={16} />
                                                        </div>

                                                        {/* 完了チェックボタン */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onToggleComplete?.(todo);
                                                            }}
                                                            className={`mt-0.5 ${todo.completed ? "text-green-500" : "text-gray-300 dark:text-gray-600 hover:text-blue-500"}`}
                                                        >
                                                            {todo.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                                                        </button>

                                                        {/* 開始ボタン (未完了時のみ表示) */}
                                                        {!todo.completed && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStart?.(todo);
                                                                }}
                                                                className="mt-0.5 ml-1 text-gray-300 dark:text-gray-600 hover:text-blue-500"
                                                            >
                                                                <PlayCircle size={18} />
                                                            </button>
                                                        )}

                                                        {/* タスク内容 */}
                                                        <div className="ml-2 flex-1 min-w-0">
                                                            <div className={`text-sm font-medium truncate ${todo.completed ? "text-gray-400 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                                                                <TodoTitle title={todo.title} />
                                                            </div>
                                                            <div className="flex items-center space-x-2 mt-0.5">
                                                                {todo.dueTime && (
                                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                                        {todo.dueTime}
                                                                    </span>
                                                                )}
                                                                {categoryName && (
                                                                    <span className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                                                        {categoryName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>
        </div>
    );
}
