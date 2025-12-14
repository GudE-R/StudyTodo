"use client";

import React from "react";
import { Circle, CheckCircle, GripVertical, Calendar, Flag } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Todo } from "@pomarc/shared";
import { format, isSameDay } from "date-fns";

interface TodoListProps {
    todos: Todo[];
    onToggle: (id: string, completed: boolean) => void;
    onSelect: (todo: Todo) => void;
    onReorder: (sourceIndex: number, destinationIndex: number) => void;
}

export function TodoList({ todos, onToggle, onSelect, onReorder }: TodoListProps) {
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;
        if (result.source.index === result.destination.index) return;
        onReorder(result.source.index, result.destination.index);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="todo-list">
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2 p-2"
                    >
                        {todos.map((todo, index) => (
                            <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-shadow ${snapshot.isDragging ? "opacity-75 shadow-lg" : ""}`}
                                    >
                                        <div
                                            {...provided.dragHandleProps}
                                            className="p-1 px-2 text-gray-400 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-2"
                                        >
                                            <GripVertical size={16} />
                                        </div>

                                        <button
                                            onClick={() => onToggle(todo.id, !todo.completed)}
                                            className={`p-1 mr-3 rounded-full transition-colors ${todo.completed ? "text-green-500" : "text-gray-300 hover:text-blue-500"}`}
                                        >
                                            {todo.completed ? (
                                                <CheckCircle size={22} fill="currentColor" className="text-white bg-green-500 rounded-full" />
                                            ) : (
                                                <Circle size={22} />
                                            )}
                                        </button>

                                        <div
                                            onClick={() => onSelect(todo)}
                                            className="flex-1 cursor-pointer min-w-0"
                                        >
                                            <div className={`font-medium truncate ${todo.completed ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                                                {todo.title}
                                            </div>
                                            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                                {todo.dueDate && (
                                                    <div className={`flex items-center ${!todo.completed && new Date(todo.dueDate) < new Date() && !isSameDay(new Date(todo.dueDate), new Date()) ? "text-red-500" : ""
                                                        }`}>
                                                        <Calendar size={12} className="mr-1" />
                                                        {format(new Date(todo.dueDate), "MMM d, HH:mm")}
                                                    </div>
                                                )}
                                                {todo.priority && todo.priority !== "medium" && (
                                                    <div className={`flex items-center ${todo.priority === "high" ? "text-red-500" : "text-blue-500"}`}>
                                                        <Flag size={12} className="mr-1" fill="currentColor" />
                                                        {todo.priority.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
