import { LocalFile } from '@/context/local/localFile/domain/LocalFile';
import { calculateFilesDiff } from './DiffFilesCalculator';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileMother } from 'tests/context/virtual-drive/files/domain/FileMother';
import { FileStatuses } from '@/context/virtual-drive/files/domain/FileStatus';
import { LocalFolder } from '@/context/local/localFolder/domain/LocalFolder';

describe('DiffFilesCalculator', () => {
  it('It should calculate files diff', () => {
    // When
    const diff = calculateFilesDiff({
      local: {
        root: LocalFolder.from({ path: 'C:/root/' as AbsolutePath, modificationTime: 0 }),
        files: {
          '/file1': LocalFile.from({ path: '/file1' as AbsolutePath, modificationTime: 0, size: 1 }),
          '/file2': LocalFile.from({ path: '/file2' as AbsolutePath, modificationTime: 0, size: 1 }),
          '/file6': LocalFile.from({ path: '/file6' as AbsolutePath, modificationTime: new Date().getTime() + 1000, size: 1 }),
        },
        folders: {},
      },
      remote: {
        files: {
          '/file1': FileMother.fromPartial({ path: '/file1' }),
          '/file3': FileMother.fromPartial({ path: '/file3' }),
          '/file4': FileMother.fromPartial({ path: '/file4', status: FileStatuses.DELETED }),
          '/file5': FileMother.fromPartial({ path: '/file5', status: FileStatuses.TRASHED }),
          '/file6': FileMother.fromPartial({ path: '/file6', updatedAt: new Date().toISOString() }),
        },
        folders: {},
      },
    });

    // Then
    expect(diff.unmodified.map((folder) => folder.path)).toEqual(['/file1']);
    expect(diff.added.map((folder) => folder.path)).toEqual(['/file2']);
    expect(diff.deleted.map((folder) => folder.path)).toEqual(['/file3']);
    expect(Array.from(diff.modified.values()).map((folder) => folder.path)).toEqual(['/file6']);
  });
});
