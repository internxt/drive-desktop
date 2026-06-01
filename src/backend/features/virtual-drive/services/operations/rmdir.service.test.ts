import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FolderDeleter } from '../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { SingleFolderMatchingFinder } from '../../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { Folder } from '../../../../../context/virtual-drive/folders/domain/Folder';
import { FolderStatuses } from '../../../../../context/virtual-drive/folders/domain/FolderStatus';
import { SyncFolderMessenger } from '../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { FolderNotFoundError } from '../../../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { rmdir } from './rmdir.service';

vi.mock('@internxt/drive-desktop-core/build/backend');

describe('rmdir', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const folderFinder = mockDeep<SingleFolderMatchingFinder>();
  const folderDeleter = mockDeep<FolderDeleter>();
  const syncFolderMessenger = mockDeep<SyncFolderMessenger>();

  beforeEach(() => {
    container = mockDeep<Container>();

    container.get.calledWith(SingleFolderMatchingFinder).mockReturnValue(folderFinder);
    container.get.calledWith(FolderDeleter).mockReturnValue(folderDeleter);
    container.get.calledWith(SyncFolderMessenger).mockReturnValue(syncFolderMessenger);
  });

  it('should trash folder when folder exists', async () => {
    folderFinder.run.mockResolvedValue(
      Folder.from({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440010',
        parentId: 2,
        path: '/some/folder',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: FolderStatuses.EXISTS,
      }),
    );

    const { data, error } = await rmdir('/some/folder', container);

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(folderDeleter.run).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440010');
    expect(syncFolderMessenger.issue).not.toHaveBeenCalled();
  });

  it('should return ENOENT when folder is not found', async () => {
    folderFinder.run.mockRejectedValue(new FolderNotFoundError('/missing/folder'));

    const { data, error } = await rmdir('/missing/folder', container);

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.ENOENT);
    expect(syncFolderMessenger.issue).toHaveBeenCalledWith({
      error: 'FOLDER_TRASH_ERROR',
      cause: 'UNKNOWN',
      name: 'folder',
    });
  });

  it('should return EIO when trash fails', async () => {
    folderFinder.run.mockResolvedValue(
      Folder.from({
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440011',
        parentId: 2,
        path: '/some/folder',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: FolderStatuses.EXISTS,
      }),
    );
    folderDeleter.run.mockRejectedValue(new Error('boom'));

    const { data, error } = await rmdir('/some/folder', container);

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EIO);
    expect(syncFolderMessenger.issue).toHaveBeenCalledWith({
      error: 'FOLDER_TRASH_ERROR',
      cause: 'UNKNOWN',
      name: 'folder',
    });
  });
});
