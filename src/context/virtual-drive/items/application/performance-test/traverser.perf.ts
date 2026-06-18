/* eslint-disable sonarjs/assertions-in-tests */
import { vi } from 'vitest';
import { generateDatasetAndRunBenchmakr } from './run-benchmark';

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
  it('measures a tree with customer-scale item counts', async () => {
    await generateDatasetAndRunBenchmakr();
  });
});
