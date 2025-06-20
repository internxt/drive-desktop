import { beforeEach } from 'vitest';
import { splitItemsIntoFilesAndFolders } from '@/backend/features/remote-notifications/in/split-items-into-files-and-folders';

describe('splitItemsIntoFilesAndFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return files and folders separated', () => {
    const result = splitItemsIntoFilesAndFolders({
      items: [
        { type: 'file', uuid: 'fi1' },
        { type: 'folder', uuid: 'fo1' },
        { type: 'file', uuid: 'fi2' },
      ],
    });

    expect(result.files).toEqual([
      { type: 'file', uuid: 'fi1' },
      { type: 'file', uuid: 'fi2' },
    ]);
    expect(result.folders).toEqual([{ type: 'folder', uuid: 'fo1' }]);
  });

  it('should return empty arrays if items is empty', () => {
    const result = splitItemsIntoFilesAndFolders({ items: [] });
    expect(result.files).toEqual([]);
    expect(result.folders).toEqual([]);
  });
});
