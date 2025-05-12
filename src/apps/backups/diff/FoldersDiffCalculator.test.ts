import { calculateFoldersDiff } from './FoldersDiffCalculator';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { LocalFolder } from '@/context/local/localFolder/domain/LocalFolder';
import { FolderStatuses } from '@/context/virtual-drive/folders/domain/FolderStatus';
import { FolderMother } from 'tests/context/virtual-drive/folders/domain/FolderMother';

describe('FoldersDiffCalculator', () => {
  it('It should calculate folders diff', () => {
    // When
    const diff = calculateFoldersDiff({
      local: {
        files: {},
        folders: {
          '/folder1': LocalFolder.from({ path: '/folder1' as AbsolutePath, modificationTime: 0 }),
          '/folder2': LocalFolder.from({ path: '/folder2' as AbsolutePath, modificationTime: 0 }),
        },
      },
      remote: {
        files: {},
        folders: {
          '/folder1': FolderMother.fromPartial({ path: '/folder1' }),
          '/folder3': FolderMother.fromPartial({ path: '/folder3' }),
          '/folder4': FolderMother.fromPartial({ path: '/folder4', status: FolderStatuses.DELETED }),
          '/folder5': FolderMother.fromPartial({ path: '/folder5', status: FolderStatuses.TRASHED }),
        },
      },
    });

    // Then
    expect(diff.unmodified.map((folder) => folder.path)).toEqual(['/folder1']);
    expect(diff.added.map((folder) => folder.path)).toEqual(['/folder2']);
    expect(diff.deleted.map((folder) => folder.path)).toEqual(['/folder3']);
  });
});
