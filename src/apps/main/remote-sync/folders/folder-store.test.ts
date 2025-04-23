import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderStore } from './folder-store';

vi.mock(import('@/context/virtual-drive/folders/domain/Folder'));

describe('folder-store', () => {
  const FolderMock = vi.mocked(Folder);

  const workspaceId = '';
  const plainName = 'file.png';

  beforeAll(() => {
    FolderMock.decryptName.mockImplementation(({ name }) => name);
  });

  beforeEach(() => {
    FolderStore.clear();
  });

  it('Should return path if all folders exist using parentId', () => {
    FolderStore.addWorkspace({ workspaceId, rootId: 109862695, rootUuid: 'c133cad4-4bf4-4b03-86eb-794aeed82302' });
    FolderStore.addFolder({ folderId: 110355389, parentId: 109862695, parentUuid: null, name: 'folder', workspaceId });
    FolderStore.addFolder({ folderId: 110750590, parentId: 110355389, parentUuid: null, name: 'folder2', workspaceId });

    const path1 = FolderStore.getFolderPath({ workspaceId, parentId: 109862695, parentUuid: null, plainName });
    expect(path1.relativePath).toBe('/file.png');

    const path2 = FolderStore.getFolderPath({ workspaceId, parentId: 110355389, parentUuid: null, plainName });
    expect(path2.relativePath).toBe('/folder/file.png');

    const path3 = FolderStore.getFolderPath({ workspaceId, parentId: 110750590, parentUuid: null, plainName });
    expect(path3.relativePath).toBe('/folder/folder2/file.png');
  });

  it('Should return path if all folders exist using parentUuid', () => {
    FolderStore.addWorkspace({ workspaceId, rootId: null, rootUuid: 'c133cad4-4bf4-4b03-86eb-794aeed82302' });

    FolderStore.addFolder({
      folderId: 110355389,
      parentId: 109862695,
      parentUuid: 'c133cad4-4bf4-4b03-86eb-794aeed82302',
      name: 'folder',
      workspaceId,
    });

    FolderStore.addFolder({
      folderId: 110750590,
      parentId: 110355389,
      parentUuid: 'c909c709-6d05-4b67-906e-2aa2dd0379bb',
      name: 'folder2',
      workspaceId,
    });

    const path1 = FolderStore.getFolderPath({
      workspaceId,
      parentId: 109862695,
      parentUuid: 'c133cad4-4bf4-4b03-86eb-794aeed82302',
      plainName,
    });
    expect(path1.relativePath).toBe('/file.png');

    const path2 = FolderStore.getFolderPath({ workspaceId, parentId: 110355389, parentUuid: null, plainName });
    expect(path2.relativePath).toBe('/folder/file.png');

    const path3 = FolderStore.getFolderPath({ workspaceId, parentId: 110750590, parentUuid: null, plainName });
    expect(path3.relativePath).toBe('/folder/folder2/file.png');
  });

  it('Should throw error if folder not found', () => {
    FolderStore.addWorkspace({ workspaceId, rootId: 109862695, rootUuid: 'c133cad4-4bf4-4b03-86eb-794aeed82302' });

    FolderStore.addFolder({
      folderId: 110753145,
      parentId: 0,
      parentUuid: null,
      name: 'wrong_parent_id',
      workspaceId,
    });

    expect(() => FolderStore.getFolderPath({ workspaceId, parentId: 0, parentUuid: null, plainName })).toThrowError();
    expect(() => FolderStore.getFolderPath({ workspaceId, parentId: 110753145, parentUuid: null, plainName })).toThrowError();
  });
});
