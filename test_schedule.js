
const { getTodoScheduleRange } = require('./packages/shared/src/utils/schedule');

// Mock Todo
const mockTodoBase = {
    id: '1',
    title: 'Test',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: '1',
};

// Case 1: dueTime is undefined (Date Only)
const todoNoTime = { ...mockTodoBase, dueDate: new Date(), dueTime: undefined };
const resultNoTime = getTodoScheduleRange(todoNoTime);
console.log('Case 1 (undefined):', resultNoTime);

// Case 2: dueTime is null
const todoNullTime = { ...mockTodoBase, dueDate: new Date(), dueTime: null };
const resultNullTime = getTodoScheduleRange(todoNullTime);
console.log('Case 2 (null):', resultNullTime);

// Case 3: dueTime is ""
const todoEmptyTime = { ...mockTodoBase, dueDate: new Date(), dueTime: "" };
const resultEmptyTime = getTodoScheduleRange(todoEmptyTime);
console.log('Case 3 (""):', resultEmptyTime);

// Case 4: dueTime is "00:00"
const todoZeroTime = { ...mockTodoBase, dueDate: new Date(), dueTime: "00:00" };
const resultZeroTime = getTodoScheduleRange(todoZeroTime);
console.log('Case 4 ("00:00"):', resultZeroTime);
