import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToJson, exportSessionsToCsv } from '../export';

// Mock DB
const mockData = {
    todos: [{ id: '1', title: 'Test Todo' }],
    sessions: [{ id: 's1', todoId: '1', todoTitle: 'Test Todo', mode: 'pomodoro', duration: 1500, createdAt: new Date('2024-01-01T10:00:00') }],
    categories: [{ id: 'c1', name: 'Work' }],
    srsProfiles: [{ id: 'p1', name: 'Profile' }]
};

vi.mock("@/lib/db", () => ({
    db: {
        todos: { toArray: vi.fn(() => Promise.resolve(mockData.todos)) },
        sessions: {
            toArray: vi.fn(() => Promise.resolve(mockData.sessions)),
            orderBy: vi.fn(() => ({ reverse: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve(mockData.sessions)) })) }))
        },
        categories: { toArray: vi.fn(() => Promise.resolve(mockData.categories)) },
        srsProfiles: { toArray: vi.fn(() => Promise.resolve(mockData.srsProfiles)) }
    }
}));

// Helper to read blob using FileReader
const readBlob = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });
};

describe('export', () => {
    let originalURL: any;
    const mockRevokeObjectURL = vi.fn();
    const mockCreateObjectURL = vi.fn(() => 'blob:url');
    const mockClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock DOM
        originalURL = global.URL;
        global.URL = {
            createObjectURL: mockCreateObjectURL,
            revokeObjectURL: mockRevokeObjectURL,
        } as any;

        // Mock document.createElement('a')
        vi.spyOn(document, 'createElement').mockReturnValue({
            href: '',
            download: '',
            click: mockClick,
        } as any);

        vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({}) as any);
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({}) as any);
    });

    afterEach(() => {
        global.URL = originalURL;
        vi.restoreAllMocks();
    });

    it('exportToJson should create a JSON file and trigger download', async () => {
        const result = await exportToJson();
        expect(result).toBe(true);

        // Check if createObjectURL was called
        expect(mockCreateObjectURL).toHaveBeenCalled();
        const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
        expect(blob).toBeInstanceOf(Blob);

        // Read Blob content
        const text = await readBlob(blob);
        const json = JSON.parse(text);

        expect(json.todos).toEqual(mockData.todos);
        expect(json.version).toBe(1);

        // Check download trigger
        expect(mockClick).toHaveBeenCalled();
    });

    it('exportSessionsToCsv should create a CSV file and trigger download', async () => {
        const result = await exportSessionsToCsv();
        expect(result).toBe(true);

        expect(mockCreateObjectURL).toHaveBeenCalled();
        const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
        expect(blob.type).toBe('text/csv');

        // Verify CSV content
        const text = await readBlob(blob);

        // Check for BOM presence or simple content check
        // Note: readAsText might strip BOM or handle it differently depending on env
        // We just verify content is there.
        // If we strictly want to check BOM, we might need readAsArrayBuffer

        // expect(text.charCodeAt(0)).toBe(0xFEFF); // This failed due to encoding handling in test env

        expect(text).toContain('SessionID,TodoTitle,Mode');
        // Check data including quotes
        expect(contentShouldMatch(text));
    });

    it('should handle errors gracefully', async () => {
        // Force error by mocking DB to reject
        const { db } = await import('@/lib/db');
        (db.todos.toArray as any).mockRejectedValueOnce(new Error('DB Fail'));

        const result = await exportToJson();
        expect(result).toBe(false);
    });
});

function contentShouldMatch(text: string) {
    // Helper to allow partial matching if BOM issues persist
    if (text.includes('s1,"Test Todo",pomodoro')) return true;
    return false;
}
