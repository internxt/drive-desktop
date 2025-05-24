import { LocalFile } from '@/context/local/localFile/domain/LocalFile';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileMother } from 'tests/context/virtual-drive/files/domain/FileMother';
import { FileStatuses } from '@/context/virtual-drive/files/domain/FileStatus';
import { LocalFolder } from '@/context/local/localFolder/domain/LocalFolder';
import { calculateFilesDiff } from './calculate-files-diff';
import { mockProps } from 'tests/vitest/utils.helper.test';

describe('calculate-files-diff', () => {
  it('It should calculate files diff', () => {
    // Given
    const props = mockProps<typeof calculateFilesDiff>({
      local: {
        root: { absolutePath: 'C:/root/' as AbsolutePath },
        files: {
          ['/file1' as RelativePath]: { path: '/file1' as AbsolutePath, modificationTime: 0, size: 1 }),
          ['/file2' as RelativePath]: { path: '/file2' as AbsolutePath, modificationTime: 0, size: 1 }),
          ['/file6' as RelativePath]: {
            path: '/file6' as AbsolutePath,
            modificationTime: new Date().getTime() + 1000,
            size: 1,
          },
        },
        folders: {},
      },
      remote: {
        files: {
          ['/file1' as RelativePath]: FileMother.fromPartial({ path: '/file1' }),
          ['/file3' as RelativePath]: FileMother.fromPartial({ path: '/file3' }),
          ['/file4' as RelativePath]: FileMother.fromPartial({ path: '/file4', status: FileStatuses.DELETED }),
          ['/file5' as RelativePath]: FileMother.fromPartial({ path: '/file5', status: FileStatuses.TRASHED }),
          ['/file6' as RelativePath]: FileMother.fromPartial({ path: '/file6', updatedAt: new Date().toISOString() }),
        },
        folders: {},
      },
    });

    // When
    const diff = calculateFilesDiff();

    // Then
    expect(diff.unmodified.map((file) => file.path)).toEqual(['/file1']);
    expect(diff.added.map((file) => file.path)).toEqual(['/file2']);
    expect(diff.deleted.map((file) => file.path)).toEqual(['/file3']);
    expect(Array.from(diff.modified.values()).map((file) => file.path)).toEqual(['/file6']);
  });
});
