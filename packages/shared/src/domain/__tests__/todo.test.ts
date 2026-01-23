import { describe, it, expect } from 'vitest';
import { parseTodoContent } from '../todo';

describe('parseTodoContent', () => {
    it('should split title and memo by newline', () => {
        const content = "Buy Milk\nMake sure it is cold";
        const result = parseTodoContent(content);
        expect(result.title).toBe("Buy Milk");
        expect(result.memo).toBe("Make sure it is cold");
    });

    it('should handle content with only title', () => {
        const content = "Buy one";
        const result = parseTodoContent(content);
        expect(result.title).toBe("Buy one");
        expect(result.memo).toBeUndefined();
    });

    it('should handle extra newlines in memo', () => {
        const content = "Title\n\nMemo line 1\nMemo line 2";
        const result = parseTodoContent(content);
        expect(result.title).toBe("Title");
        expect(result.memo).toBe("Memo line 1\nMemo line 2");
    });

    it('should use fallback title if content title is empty', () => {
        const content = "\nSome memo"; // Empty title line
        const result = parseTodoContent(content, "Work");
        expect(result.title).toBe("Work");
        expect(result.memo).toBe("Some memo");
    });

    it('should use default title if both content and fallback are empty', () => {
        const content = "";
        const result = parseTodoContent(content, undefined, "No Title");
        expect(result.title).toBe("No Title");
        expect(result.memo).toBeUndefined();
    });

    it('should trim whitespace from title and memo', () => {
        const content = "  Trim Me  \n  And Me  ";
        const result = parseTodoContent(content);
        expect(result.title).toBe("Trim Me");
        expect(result.memo).toBe("And Me");
    });
});
