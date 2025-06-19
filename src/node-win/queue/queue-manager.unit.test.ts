import { join } from 'path';
import { v4 } from 'uuid';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import { QueueHandler, QueueManager } from './queue-manager';
import { QueueItem, typeQueue } from './queueManager';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';

describe('QueueManager', () => {
  const mockHandlers = mockDeep<QueueHandler>();
  const persistPath = join(TEST_FILES, v4());
  const queueManager = new QueueManager({ handlers: mockHandlers, persistPath });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a task to the queue and sort it correctly', async () => {
    const tasks: QueueItem[] = [
      { path: '\\test\\folder4', isFolder: true, type: typeQueue.add },
      { path: '\\test\\folder\\test.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test\\test.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test', isFolder: true, type: typeQueue.add },
      { path: '\\test\\test2.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test\\folder', isFolder: true, type: typeQueue.add },
      { path: '\\test\\folder2\\file-pdf', isFolder: false, type: typeQueue.add },
      { path: '\\test\\folder3', isFolder: true, type: typeQueue.add },
      { path: '\\test\\folder3\\file12.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test\\folder3\\folder3', isFolder: true, type: typeQueue.add },
    ];

    tasks.forEach((task) => queueManager.enqueue(task));

    expect(queueManager['queues'][typeQueue.add]).toStrictEqual([
      { path: '\\test', isFolder: true, type: typeQueue.add },
      { path: '\\test\\test.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test\\test2.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test\\folder', isFolder: true, type: typeQueue.add },
      { path: '\\test\\folder3', isFolder: true, type: typeQueue.add },
      { path: '\\test\\folder4', isFolder: true, type: typeQueue.add },
      { path: '\\test\\folder\\test.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test\\folder2\\file-pdf', isFolder: false, type: typeQueue.add },
      { path: '\\test\\folder3\\file12.txt', isFolder: false, type: typeQueue.add },
      { path: '\\test\\folder3\\folder3', isFolder: true, type: typeQueue.add },
    ]);
  });

  it('should not add a duplicate task', () => {
    const task: QueueItem = { path: '\\test.txt', isFolder: false, type: typeQueue.add };
    queueManager.enqueue(task);
    queueManager.enqueue(task);

    expect(queueManager['queues'][typeQueue.add].length).toBe(1);
  });

  it('should clear the queue', () => {
    queueManager.enqueue({ path: '\\test', isFolder: true, type: typeQueue.add });
    queueManager.clearQueue();

    expect(queueManager['queues'][typeQueue.add].length).toBe(0);
  });

  it('should correctly order deeply nested structures', () => {
    const tasks: QueueItem[] = [
      { path: '\\folder', isFolder: true, type: typeQueue.add },
      { path: '\\folder\\subfolder', isFolder: true, type: typeQueue.add },
      { path: '\\folder\\file.txt', isFolder: false, type: typeQueue.add },
      { path: '\\folder\\subfolder\\file2.txt', isFolder: false, type: typeQueue.add },
      { path: '\\folder\\subfolder\\deep', isFolder: true, type: typeQueue.add },
      { path: '\\folder\\subfolder\\deep\\file3.txt', isFolder: false, type: typeQueue.add },
    ];

    tasks.forEach((task) => queueManager.enqueue(task));

    expect(queueManager['queues'][typeQueue.add]).toStrictEqual([
      { path: '\\folder', isFolder: true, type: typeQueue.add },
      { path: '\\folder\\file.txt', isFolder: false, type: typeQueue.add },
      { path: '\\folder\\subfolder', isFolder: true, type: typeQueue.add },
      { path: '\\folder\\subfolder\\file2.txt', isFolder: false, type: typeQueue.add },
      { path: '\\folder\\subfolder\\deep', isFolder: true, type: typeQueue.add },
      { path: '\\folder\\subfolder\\deep\\file3.txt', isFolder: false, type: typeQueue.add },
    ]);
  });

  it('should handle mixed folder\\file ordering properly', () => {
    const tasks: QueueItem[] = [
      { path: '\\alpha', isFolder: true, type: typeQueue.add },
      { path: '\\alpha\\file1.txt', isFolder: false, type: typeQueue.add },
      { path: '\\alpha\\file2.txt', isFolder: false, type: typeQueue.add },
      { path: '\\beta', isFolder: true, type: typeQueue.add },
      { path: '\\beta\\file3.txt', isFolder: false, type: typeQueue.add },
      { path: '\\gamma\\file4.txt', isFolder: false, type: typeQueue.add },
      { path: '\\gamma', isFolder: true, type: typeQueue.add },
    ];

    tasks.forEach((task) => queueManager.enqueue(task));

    expect(queueManager['queues'][typeQueue.add]).toStrictEqual([
      { path: '\\alpha', isFolder: true, type: typeQueue.add },
      { path: '\\beta', isFolder: true, type: typeQueue.add },
      { path: '\\gamma', isFolder: true, type: typeQueue.add },
      { path: '\\alpha\\file1.txt', isFolder: false, type: typeQueue.add },
      { path: '\\alpha\\file2.txt', isFolder: false, type: typeQueue.add },
      { path: '\\beta\\file3.txt', isFolder: false, type: typeQueue.add },
      { path: '\\gamma\\file4.txt', isFolder: false, type: typeQueue.add },
    ]);
  });
});
