import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, it, expect, vi } from 'vitest';
import { HomeDaySchedule } from '../HomeDaySchedule';

// Mock Theme and Translation
vi.mock('../../../providers/ThemeProvider', () => ({
    useThemeColors: () => ({
        colors: {
            background: '#fff',
            surface: '#f5f5f5',
            text: '#000',
            textMuted: '#666',
            border: '#ddd',
            primary: '#007AFF',
        }
    })
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'ja' }
    })
}));

vi.mock('../../../lib/date-fns-locales', () => ({
    getDateFnsLocale: () => ({})
}));

// Mock Data Hooks
vi.mock('../../../hooks/useMobileTodos', () => ({
    useMobileTodos: () => ({
        todos: [],
        refreshTodos: vi.fn()
    })
}));

vi.mock('../../../hooks/useMobileCategories', () => ({
    useMobileCategories: () => ({
        categories: [],
        refreshCategories: vi.fn()
    })
}));

// Mock FlatList (Rendering items directly for simpler test)
vi.mock('react-native', async (importOriginal) => {
    const original = await importOriginal<typeof import('react-native')>();
    return {
        ...original,
        FlatList: ({ renderItem, data }: any) => (
            <>
                {data.slice(0, 1).map((item: any, index: number) => renderItem({ item, index }))}
            </>
        ),
    };
});

describe('HomeDaySchedule', () => {
    it('renders time labels correctly', () => {
        const { getByTestId } = render(<HomeDaySchedule />);

        // Check for specific time labels (08:00, 12:00, 23:00)
        // Note: isHalfHour entries are usually empty text unless kept, but let's check a full hour
        const label0800 = getByTestId('time-label-08:00');
        expect(label0800).toBeTruthy();
        expect(label0800.props.children).toBe('08:00');
    });

    it('applies correct styling for visibility', () => {
        const { getByTestId } = render(<HomeDaySchedule />);

        // This confirms the testID is present on the container we fixed
        const label0800 = getByTestId('time-label-08:00');

        // Check if the parent container (hourLineContainer) has appropriate styles
        // In @testing-library/react-native, we can sometimes check parent props
        // but here we just ensure the text itself is rendered.
        expect(label0800.props.style).toContain({ fontSize: 10 });
    });

    it('renders hour lines for all segments', () => {
        const { getByTestId } = render(<HomeDaySchedule />);

        // Horizontal lines should exist even for half-hours
        expect(getByTestId('hour-line-08:00')).toBeTruthy();
        expect(getByTestId('hour-line-08:30')).toBeTruthy();
    });
});
