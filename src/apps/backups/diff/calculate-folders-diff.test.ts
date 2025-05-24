import { calculateFoldersDiff } from './calculate-folders-diff';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderStatuses } from '@/context/virtual-drive/folders/domain/FolderStatus';
import { FolderMother } from 'tests/context/virtual-drive/folders/domain/FolderMother';
import { mockProps } from 'tests/vitest/utils.helper.test';

describe('calculate-folders-diff', () => {
  it('It should calculate folders diff', () => {
    // Given
    const props = mockProps<typeof calculateFoldersDiff>({
      local: {
        files: {},
        folders: {
          ['/folder1' as RelativePath]: { relativePath: '/folder1' as RelativePath },
          ['/folder2' as RelativePath]: { relativePath: '/folder2' as RelativePath },
        },
      },
      remote: {
        files: {},
        folders: {
          ['/folder1' as RelativePath]: FolderMother.fromPartial({ path: '/folder1' }),
          ['/folder3' as RelativePath]: FolderMother.fromPartial({ path: '/folder3' }),
          ['/folder4' as RelativePath]: FolderMother.fromPartial({ path: '/folder4', status: FolderStatuses.DELETED }),
          ['/folder5' as RelativePath]: FolderMother.fromPartial({ path: '/folder5', status: FolderStatuses.TRASHED }),
        },
      },
    });

    // When
    const diff = calculateFoldersDiff(props);

    // Then
    expect(diff.unmodified.map((folder) => folder.relativePath)).toEqual(['/folder1']);
    expect(diff.added.map((folder) => folder.relativePath)).toEqual(['/folder2']);
    expect(diff.deleted.map((folder) => folder.path)).toEqual(['/folder3']);
  });
});
