import { renderHook } from '@testing-library/react-native';
import { useMobileTodos } from '../useMobileTodos';
import { RepositoryProvider } from '../../providers/RepositoryProvider';
import React from 'react';

// Mock repository
const mockRepository = {
    getTodos: jest.fn(() => Promise.resolve([])),
    onDataChange: jest.fn(() => jest.fn()),
    addTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
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
