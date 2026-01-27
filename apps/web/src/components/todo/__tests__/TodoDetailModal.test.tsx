import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoDetailModal } from "../TodoDetailModal";
import { Todo, Category, SRSProfile } from "@studytodo/shared";

// Mocks
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock("dexie-react-hooks", () => ({
    useLiveQuery: () => [],
}));

vi.mock("@/lib/db", () => ({
    db: {
        sessions: {
            where: () => ({ equals: () => ({ toArray: () => [] }) }),
        },
    },
}));

// Mock Data
const mockTodo: Todo = {
    id: "todo-1",
    title: "Original Title",
    memo: "Original Memo",
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    categoryId: "cat-1",
    srsInterval: "",
};

const mockCategories: Category[] = [
    { id: "cat-1", name: "Work", level: "large", order: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: "cat-2", name: "Personal", level: "large", order: 2, createdAt: new Date(), updatedAt: new Date() },
];

const mockSrsProfiles: SRSProfile[] = [
    { id: "srs-1", name: "Ebbinghaus", intervals: [1, 3, 7], createdAt: new Date(), updatedAt: new Date() },
];

describe("TodoDetailModal", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        todo: mockTodo,
        categories: mockCategories,
        srsProfiles: mockSrsProfiles,
        onStartNow: vi.fn(),
        onDelete: vi.fn(),
        onUpdate: vi.fn(),
        onRecord: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // window.confirm mock
        Object.defineProperty(window, 'confirm', { writable: true, value: vi.fn(() => true) });
        // window.alert mock
        Object.defineProperty(window, 'alert', { writable: true, value: vi.fn() });
    });

    it("renders nothing when isOpen is false", () => {
        const { container } = render(<TodoDetailModal {...defaultProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders correctly with todo data", () => {
        render(<TodoDetailModal {...defaultProps} />);

        // Assert title and memo are combined in the textarea
        const textarea = screen.getByTestId("content-textarea") as HTMLTextAreaElement;
        expect(textarea.value).toBe("Original Title\nOriginal Memo");

        // Assert category is selected
        const select = screen.getByTestId("category-select") as HTMLSelectElement;
        expect(select.value).toBe("cat-1");
    });

    it("calls onUpdate with parsed content when saving", () => {
        render(<TodoDetailModal {...defaultProps} />);

        // Edit Content
        const textarea = screen.getByTestId("content-textarea");
        fireEvent.change(textarea, { target: { value: "New Title\nNew Memo" } });

        // Save
        const saveButton = screen.getByText("save");
        fireEvent.click(saveButton);

        // Verify onUpdate
        expect(defaultProps.onUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockTodo.id,
                title: "New Title",
                memo: "New Memo",
            }),
            { applySrs: false }
        );
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("uses category name as fallback title when title is empty", () => {
        render(<TodoDetailModal {...defaultProps} />);

        // Empty Title, keep Memo
        const textarea = screen.getByTestId("content-textarea");
        fireEvent.change(textarea, { target: { value: "\nMemo Only" } });

        // Save
        const saveButton = screen.getByText("save");
        fireEvent.click(saveButton);

        // Verify fallback to "Work" (Category Name)
        expect(defaultProps.onUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Work",
                memo: "Memo Only",
            }),
            { applySrs: false }
        );
    });

    it("triggers SRS alert when SRS profile is changed", () => {
        render(<TodoDetailModal {...defaultProps} />);

        // Change SRS
        const srsSelect = screen.getByTestId("srs-select");
        fireEvent.change(srsSelect, { target: { value: "Ebbinghaus" } });

        // Save
        const saveButton = screen.getByText("save");
        fireEvent.click(saveButton);

        // Verify confirm was called and applySrs is true
        expect(window.confirm).toHaveBeenCalled();
        expect(defaultProps.onUpdate).toHaveBeenCalledWith(
            expect.anything(),
            { applySrs: true }
        );
    });
});
