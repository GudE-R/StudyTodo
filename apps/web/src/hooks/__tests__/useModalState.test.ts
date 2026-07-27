import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalState } from '../useModalState';
import { Todo } from '@studytodo/shared';

describe('useModalState', () => {
    describe('初期状態', () => {
        it('全モーダルが閉じていること', () => {
            const { result } = renderHook(() => useModalState());

            expect(result.current.isTodoModalOpen).toBe(false);
            expect(result.current.isTemplateModalOpen).toBe(false);
            expect(result.current.isActivityModalOpen).toBe(false);
            expect(result.current.isSettingsModalOpen).toBe(false);
            expect(result.current.isGuideModalOpen).toBe(false);
            expect(result.current.isAuthModalOpen).toBe(false);
            expect(result.current.isTodoDetailOpen).toBe(false);
            expect(result.current.isFeedbackModalOpen).toBe(false);
            expect(result.current.selectedTodo).toBeNull();
            expect(result.current.isAnyModalOpen).toBe(false);
        });
    });

    describe('個別モーダルの開閉', () => {
        it('Todoモーダルを開閉できること', () => {
            const { result } = renderHook(() => useModalState());

            act(() => {
                result.current.setIsTodoModalOpen(true);
            });
            expect(result.current.isTodoModalOpen).toBe(true);

            act(() => {
                result.current.setIsTodoModalOpen(false);
            });
            expect(result.current.isTodoModalOpen).toBe(false);
        });

        it('設定モーダルを開閉できること', () => {
            const { result } = renderHook(() => useModalState());

            act(() => {
                result.current.setIsSettingsModalOpen(true);
            });
            expect(result.current.isSettingsModalOpen).toBe(true);
        });
    });

    describe('isAnyModalOpen', () => {
        it('いずれかのモーダルが開いていればtrueを返すこと', () => {
            const { result } = renderHook(() => useModalState());

            act(() => {
                result.current.setIsActivityModalOpen(true);
            });
            expect(result.current.isAnyModalOpen).toBe(true);
        });

        it('全て閉じていればfalseを返すこと', () => {
            const { result } = renderHook(() => useModalState());
            expect(result.current.isAnyModalOpen).toBe(false);
        });
    });

    describe('closeAllModals', () => {
        it('全モーダルを閉じること', () => {
            const { result } = renderHook(() => useModalState());

            act(() => {
                result.current.setIsTodoModalOpen(true);
                result.current.setIsSettingsModalOpen(true);
                result.current.setIsGuideModalOpen(true);
            });
            expect(result.current.isAnyModalOpen).toBe(true);

            act(() => {
                result.current.closeAllModals();
            });
            expect(result.current.isTodoModalOpen).toBe(false);
            expect(result.current.isSettingsModalOpen).toBe(false);
            expect(result.current.isGuideModalOpen).toBe(false);
            expect(result.current.isAnyModalOpen).toBe(false);
        });
    });

    describe('openTodoDetail', () => {
        it('selectedTodoが設定されisTodoDetailOpenがtrueになること', () => {
            const { result } = renderHook(() => useModalState());
            const mockTodo: Todo = {
                id: 'test-1',
                title: 'テストTodo',
                completed: false,
                createdAt: new Date('2024-01-01T00:00:00Z'),
                updatedAt: new Date('2024-01-01T00:00:00Z'),
            };

            act(() => {
                result.current.openTodoDetail(mockTodo);
            });

            expect(result.current.selectedTodo).toEqual(mockTodo);
            expect(result.current.isTodoDetailOpen).toBe(true);
            expect(result.current.isAnyModalOpen).toBe(true);
        });
    });
});
