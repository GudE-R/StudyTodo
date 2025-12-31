import { describe, it, expect } from 'vitest';
import { mapper } from '../mapper';

describe('mapper', () => {
    describe('toSupabase', () => {
        it('camelCase を snake_case に変換する', () => {
            const input = { userId: '123', createdAt: new Date('2025-01-01') };
            const result = mapper.toSupabase(input);

            expect(result).toHaveProperty('user_id');
            expect(result).toHaveProperty('created_at');
            expect(result).not.toHaveProperty('userId');
            expect(result).not.toHaveProperty('createdAt');
        });

        it('Date を ISO 文字列に変換する', () => {
            const date = new Date('2025-01-01T10:00:00.000Z');
            const result = mapper.toSupabase({ createdAt: date });

            expect(result['created_at']).toBe('2025-01-01T10:00:00.000Z');
        });

        it('無効な Date は null に変換する', () => {
            const invalidDate = new Date('invalid');
            const result = mapper.toSupabase({ createdAt: invalidDate });

            expect(result['created_at']).toBeNull();
        });

        it('allowedFields でフィルタリングする', () => {
            const input = { id: '1', title: 'Test', secret: 'hidden' };
            const result = mapper.toSupabase(input, undefined, ['id', 'title']);

            expect(result).toHaveProperty('id', '1');
            expect(result).toHaveProperty('title', 'Test');
            expect(result).not.toHaveProperty('secret');
        });

        it('userId を追加する', () => {
            const result = mapper.toSupabase({ id: '1' }, 'user-123');

            expect(result['user_id']).toBe('user-123');
        });

        it('userId と allowedFields を同時に使用できる', () => {
            const result = mapper.toSupabase(
                { id: '1', title: 'Test', secret: 'hidden' },
                'user-123',
                ['id', 'title']
            );

            expect(result).toHaveProperty('id', '1');
            expect(result).toHaveProperty('title', 'Test');
            expect(result).toHaveProperty('user_id', 'user-123');
            expect(result).not.toHaveProperty('secret');
        });
    });

    describe('fromSupabase', () => {
        it('snake_case を camelCase に変換する', () => {
            const input = { user_id: '123', created_at: '2025-01-01' };
            const result = mapper.fromSupabase(input);

            // user_id はスキップされる
            expect(result).not.toHaveProperty('userId');
            expect(result).not.toHaveProperty('user_id');
            expect(result).toHaveProperty('createdAt');
        });

        it('日付文字列を Date オブジェクトに変換する', () => {
            const input = { created_at: '2025-01-01T10:00:00.000Z' };
            const result = mapper.fromSupabase<{ createdAt: Date }>(input);

            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.createdAt.toISOString()).toBe('2025-01-01T10:00:00.000Z');
        });

        it('無効な日付文字列は undefined にする', () => {
            const input = { created_at: 'invalid-date' };
            const result = mapper.fromSupabase<{ createdAt: Date | undefined }>(input);

            expect(result.createdAt).toBeUndefined();
        });

        it('user_id フィールドをスキップする', () => {
            const input = { id: '1', user_id: 'user-123', title: 'Test' };
            const result = mapper.fromSupabase(input);

            expect(result).toHaveProperty('id', '1');
            expect(result).toHaveProperty('title', 'Test');
            expect(result).not.toHaveProperty('userId');
            expect(result).not.toHaveProperty('user_id');
        });

        it('estimated_time を estimatedDuration にマッピングする', () => {
            const input = { id: '1', estimated_time: 30 };
            const result = mapper.fromSupabase<{ estimatedDuration: number }>(input);

            expect(result).toHaveProperty('estimatedDuration', 30);
            expect(result).not.toHaveProperty('estimatedTime');
        });

        it('複数の日付フィールドを正しく変換する', () => {
            const input = {
                id: '1',
                created_at: '2025-01-01T10:00:00.000Z',
                updated_at: '2025-01-02T10:00:00.000Z',
                due_date: '2025-01-03T10:00:00.000Z',
                start_time: '2025-01-01T09:00:00.000Z',
                end_time: '2025-01-01T11:00:00.000Z'
            };
            const result = mapper.fromSupabase<{
                createdAt: Date;
                updatedAt: Date;
                dueDate: Date;
                startTime: Date;
                endTime: Date;
            }>(input);

            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
            expect(result.dueDate).toBeInstanceOf(Date);
            expect(result.startTime).toBeInstanceOf(Date);
            expect(result.endTime).toBeInstanceOf(Date);
        });

        it('非日付フィールドは文字列のまま保持する', () => {
            const input = { id: '1', title: 'Test Todo', notes: 'Some notes' };
            const result = mapper.fromSupabase<{ id: string; title: string; notes: string }>(input);

            expect(result.id).toBe('1');
            expect(result.title).toBe('Test Todo');
            expect(result.notes).toBe('Some notes');
        });
    });
});
