import { calculateFoldersDiff } from './calculate-folders-diff';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps } from 'tests/vitest/utils.helper.test';

describe('calculate-folders-diff', () => {
  it('It should calculate folders diff', () => {
    // Given
    const folder1 = createRelativePath('folder1');
    const folder2 = createRelativePath('folder2');
    const folder3 = createRelativePath('folder3');

    const props = mockProps<typeof calculateFoldersDiff>({
      local: {
        files: {},
        folders: {
          [folder1]: { relativePath: folder1 },
          [folder2]: { relativePath: folder2 },
        },
      },
      remote: {
        files: {},
        folders: {
          [folder1]: { path: folder1 },
          [folder3]: { path: folder3 },
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
