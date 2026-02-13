import { Todo } from "../types";
import { generateId as defaultGenerateId } from "../utils";
import { addDays } from "date-fns";

/**
 * SRSプロファイルに基づいて、複数のTodo(復習)を一括生成します。
 * @param baseTodo - 元となるTodo
 * @param intervals - 復習間隔（日）の配列
 * @param idGenerator - ID生成関数（オプション）。指定がない場合はsharedのデフォルトを使用。
 */
export function generateSRSTodos(
    baseTodo: Todo,
    intervals: number[],
    idGenerator: () => string = defaultGenerateId
): Todo[] {
    const baseId = idGenerator();
    // Base Todo
    const todoWithId: Todo = {
        ...baseTodo,
        id: baseId,
        srsGroupId: baseId, // Self-reference for Root
        createdAt: new Date(),
        updatedAt: new Date(),
        completed: false,
    };
    const todosToAdd: Todo[] = [todoWithId];
    const baseDate = baseTodo.dueDate ? new Date(baseTodo.dueDate) : new Date();

    intervals.forEach((days, index) => {
        const reviewTodo: Todo = {
            ...baseTodo,
            id: idGenerator(),
            title: `${baseTodo.title} (${index + 1}回目)`, // Updated format
            dueDate: addDays(baseDate, days),
            completed: false,
            updatedAt: new Date(),
            createdAt: new Date(),
            srsGroupId: baseId, // Link to Root
            srsInterval: undefined, // Children don't need the profile name/interval string if they are just instances
            srsProfileId: undefined
        };
        todosToAdd.push(reviewTodo);
    });

    return todosToAdd;
}

/**
 * 既存のTodoに後からSRSを適用し、子タスクを生成します。
 * @param todo - 既存のTodo
 * @param intervals - 復習間隔（日）の配列
 * @param idGenerator - ID生成関数（オプション）。指定がない場合はsharedのデフォルトを使用。
 */
export function generateSRSTodosForExisting(
    todo: Todo,
    intervals: number[],
    idGenerator: () => string = defaultGenerateId
): { updatedBase: Todo, children: Todo[] } {
    const srsGroupId = todo.srsGroupId || todo.id; // Use existing group ID or self as root

    // Update Base Todo if needed
    const updatedBase: Todo = { ...todo, srsGroupId };

    // Check if we need to update createdAt/updatedAt? No, keep original.

    const baseDate = todo.dueDate ? new Date(todo.dueDate) : new Date();
    const children: Todo[] = [];

    intervals.forEach((days, index) => {
        const reviewTodo: Todo = {
            ...todo,
            id: idGenerator(),
            title: `${todo.title} (${index + 1}回目)`,
            dueDate: addDays(baseDate, days),
            completed: false,
            updatedAt: new Date(),
            createdAt: new Date(),
            srsGroupId: srsGroupId,
            srsInterval: undefined,
            srsProfileId: undefined
        };
        children.push(reviewTodo);
    });

    return { updatedBase, children };
}
