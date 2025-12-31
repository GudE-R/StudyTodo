import { renderHook } from '@testing-library/react-native';
import { describe, it, expect, vi } from 'vitest';
import { useMobileTodos } from '../useMobileTodos';
import { RepositoryProvider } from '../../providers/RepositoryProvider';
import React from 'react';

// Mock repository
const mockRepository = {
    getTodos: vi.fn(() => Promise.resolve([])),
    onDataChange: vi.fn(() => vi.fn()),
    addTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RepositoryProvider repository={mockRepository as any}>
        {children}
    </RepositoryProvider>
);

describe('useMobileTodos', () => {
    it('should fetch todos on mount', async () => {
        renderHook(() => useMobileTodos(), { wrapper });
        expect(mockRepository.getTodos).toHaveBeenCalled();
    });
});

