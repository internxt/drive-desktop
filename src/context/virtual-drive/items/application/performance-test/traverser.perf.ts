/* eslint-disable sonarjs/assertions-in-tests */
import { vi } from 'vitest';
import { generateDatasetAndRunBenchmark } from './run-benchmark';

vi.mock('@/backend/features/remote-sync/file-explorer/update-file-placeholder', () => ({
  updateFilePlaceholder: async () => undefined,
}));

vi.mock('@/backend/features/remote-sync/file-explorer/update-folder-placeholder', () => ({
  updateFolderPlaceholder: async () => true,
}));

vi.mock('@/backend/features/remote-sync/file-explorer/delete-item-placeholder', () => ({
  deleteItemPlaceholder: async () => undefined,
}));

describe('traverse performance', () => {
  it('measures traverser with item counts', async () => {
    await generateDatasetAndRunBenchmark();
  });
});
