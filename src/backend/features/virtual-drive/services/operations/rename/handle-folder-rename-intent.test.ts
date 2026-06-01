import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { SingleFolderMatchingSearcher } from '../../../../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';
import { Folder, FolderAttributes } from '../../../../../../context/virtual-drive/folders/domain/Folder';
import { FolderStatuses } from '../../../../../../context/virtual-drive/folders/domain/FolderStatus';
import { FuseCodes } from '../../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { handleFolderRenameIntent } from './handle-folder-rename-intent';
import * as trashFolderModule from './trash-folder';
import * as moveFolderModule from './move-folder';
import { call, calls, partialSpyOn } from '../../../../../../../tests/vitest/utils.helper';

const folderAttrs: FolderAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  parentId: 0,
  path: '/old/folder',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  status: FolderStatuses.EXISTS,
};

describe('handle-folder-rename-intent', () => {
  const trashFolderMock = partialSpyOn(trashFolderModule, 'trashFolder');
  const moveFolderMock = partialSpyOn(moveFolderModule, 'moveFolder');
  let container: ReturnType<typeof mockDeep<Container>>;
  let searcherMock: ReturnType<typeof mockDeep<SingleFolderMatchingSearcher>>;

  const props: Parameters<typeof handleFolderRenameIntent>[0] = {
    src: '/old/folder',
    dest: '/new/folder',
    container: undefined as unknown as Container,
  };

  beforeEach(() => {
    searcherMock = mockDeep<SingleFolderMatchingSearcher>();
    container = mockDeep<Container>();
    container.get.calledWith(SingleFolderMatchingSearcher).mockReturnValue(searcherMock);
    props.container = container;
    trashFolderMock.mockResolvedValue({ data: undefined });
    moveFolderMock.mockResolvedValue({ data: undefined });
  });

  it('should return ENOENT when folder is not found', async () => {
    // Given
    searcherMock.run.mockResolvedValue(undefined);

    // When
    const result = await handleFolderRenameIntent(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.ENOENT);
    calls(trashFolderMock).toHaveLength(0);
    calls(moveFolderMock).toHaveLength(0);
  });

  it('should delegate to trashFolder when dest starts with /.Trash', async () => {
    // Given
    const folder = Folder.from(folderAttrs);
    searcherMock.run.mockResolvedValue(folder);

    // When
    const result = await handleFolderRenameIntent({ ...props, dest: '/.Trash/folder' });

    // Then
    expect(result.data).toBeUndefined();
    call(trashFolderMock).toStrictEqual({ folder, container });
    calls(moveFolderMock).toHaveLength(0);
  });

  it('should delegate to moveFolder when dest is a regular path', async () => {
    // Given
    const folder = Folder.from(folderAttrs);
    searcherMock.run.mockResolvedValue(folder);

    // When
    const result = await handleFolderRenameIntent(props);

    // Then
    expect(result.data).toBeUndefined();
    call(moveFolderMock).toStrictEqual({ folder, src: props.src, dest: props.dest, container });
    calls(trashFolderMock).toHaveLength(0);
  });

  it('should propagate error from trashFolder', async () => {
    // Given
    const folder = Folder.from(folderAttrs);
    searcherMock.run.mockResolvedValue(folder);
    trashFolderMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'trash failed') });

    // When
    const result = await handleFolderRenameIntent({ ...props, dest: '/.Trash/folder' });

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
  });

  it('should propagate error from moveFolder', async () => {
    // Given
    const folder = Folder.from(folderAttrs);
    searcherMock.run.mockResolvedValue(folder);
    moveFolderMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'move failed') });

    // When
    const result = await handleFolderRenameIntent(props);

    // Then
    expect(result.error?.code).toBe(FuseCodes.EIO);
  });

  it('should search for folder with EXISTS status and src path', async () => {
    // Given
    searcherMock.run.mockResolvedValue(undefined);

    // When
    await handleFolderRenameIntent(props);

    // Then
    call(searcherMock.run).toStrictEqual({ path: props.src, status: FolderStatuses.EXISTS });
  });
});
