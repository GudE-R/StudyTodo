export interface ParseTodoContentResult {
    title: string;
    memo?: string;
}

/**
 * Parses the raw content string from the Todo input field.
 * Splits the content by the first newline to separate title and memo (notes).
 * 
 * @param content - The raw string from the input (e.g., "Title\nMemo body")
 * @param fallbackTitle - Optional title to use if the parsed title is empty (e.g., Category name)
 * @param defaultTitle - Default string to return if both parsed and fallback titles are empty (default: "Untitled")
 * @returns Object containing the parsed title and memo
 */
export const parseTodoContent = (
    content: string,
    fallbackTitle?: string,
    defaultTitle: string = "Untitled"
): ParseTodoContentResult => {
    const lines = content.split("\n");
    const rawTitle = lines[0].trim();
    const notes = lines.slice(1).join("\n").trim();

    let effectiveTitle = rawTitle;

    // If title is empty, try to use the fallback (e.g., category name)
    if (!effectiveTitle && fallbackTitle) {
        effectiveTitle = fallbackTitle;
    }

    // If still empty, use the default title
    return {
        title: effectiveTitle || defaultTitle,
        memo: notes || undefined
    };
};
