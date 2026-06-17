/* eslint-disable sonarjs/assertions-in-tests */
import { vi } from 'vitest';
import { runScenario } from './run-benchmark';

vi.mock('@/backend/features/remote-sync/file-explorer/update-file-placeholder', () => ({
  updateFilePlaceholder: vi.fn(async () => undefined),
}));

vi.mock('@/backend/features/remote-sync/file-explorer/update-folder-placeholder', () => ({
  updateFolderPlaceholder: vi.fn(async () => true),
}));

vi.mock('@/backend/features/remote-sync/file-explorer/delete-item-placeholder', () => ({
  deleteItemPlaceholder: vi.fn(async () => undefined),
}));

describe('traverse deep performance', () => {
  afterEach(() => {
    vi.clearAllMocks();
    globalThis.gc?.();
  });

  it('measures traversal time and memory with a deeply nested synthetic dataset', async () => {
    await runScenario('deep');
  });
});
