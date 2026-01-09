import { calculateFoldersDiff } from './calculate-folders-diff';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps } from 'tests/vitest/utils.helper.test';

describe('calculate-folders-diff', () => {
  it('It should calculate folders diff', () => {
    // Given
    const folder1 = abs('/folder1');
    const folder2 = abs('/folder2');
    const folder3 = abs('/folder3');

    const props = mockProps<typeof calculateFoldersDiff>({
      local: {
        files: {},
        folders: [folder1, folder2],
      },
      remote: {
        files: new Map(),
        folders: new Map([
          [folder1, { absolutePath: folder1 }],
          [folder3, { absolutePath: folder3 }],
        ]),
      },
    });

    // When
    const diff = calculateFoldersDiff(props);

    // Then
    expect(diff.unmodified).toStrictEqual(['/folder1']);
    expect(diff.added).toStrictEqual(['/folder2']);
    expect(diff.deleted.map((folder) => folder.absolutePath)).toStrictEqual(['/folder3']);
  });
});
