import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FolderCreator } from '../../../../../context/virtual-drive/folders/application/create/FolderCreator';
import { SyncFolderMessenger } from '../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { mkdir } from './mkdir.service';

describe('mkdir', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const folderCreator = mockDeep<FolderCreator>();
  const syncFolderMessenger = mockDeep<SyncFolderMessenger>();

  beforeEach(() => {
    container = mockDeep<Container>();
    container.get.calledWith(FolderCreator).mockReturnValue(folderCreator);
    container.get.calledWith(SyncFolderMessenger).mockReturnValue(syncFolderMessenger);
  });

  it('should create folder and notify when path is valid', async () => {
    const { data, error } = await mkdir('/Documents/NewFolder', container);

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(syncFolderMessenger.creating).toBeCalledWith('/Documents/NewFolder');
    expect(folderCreator.run).toBeCalledWith('/Documents/NewFolder');
    expect(syncFolderMessenger.created).toBeCalledWith('/Documents/NewFolder');
  });

  it('should return success without calling FolderCreator when path starts with /.Trash', async () => {
    const { data, error } = await mkdir('/.Trash-1000/files/doc.txt', container);

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
    expect(folderCreator.run).not.toBeCalled();
  });

  it('should return EIO and notify issue when FolderCreator throws', async () => {
    folderCreator.run.mockRejectedValue(new Error('remote error'));

    const { data, error } = await mkdir('/Documents/NewFolder', container);

    expect(data).toBeUndefined();
    expect(error?.code).toBe(FuseCodes.EIO);
    expect(syncFolderMessenger.issue).toBeCalledWith(
      expect.objectContaining({ error: 'FOLDER_CREATE_ERROR', cause: 'UNKNOWN' }),
    );
  });
});
