import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderMother } from '../domain/FolderMother';
import { OfflineFolderMother } from '../domain/OfflineFolderMother';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { mockDeep } from 'vitest-mock-extended';
import { InMemoryFolderRepository } from '@/context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';
import { FolderId } from '@/context/virtual-drive/folders/domain/FolderId';
import { FolderUuid } from '@/context/virtual-drive/folders/domain/FolderUuid';
import { FolderPath } from '@/context/virtual-drive/folders/domain/FolderPath';
import VirtualDrive from '@/node-win/virtual-drive';

describe('Folder Creator', () => {
  const repository = mockDeep<InMemoryFolderRepository>();
  const remote = mockDeep<HttpRemoteFolderSystem>();
  const virtualDrive = mockDeep<VirtualDrive>();

  const SUT = new FolderCreator(repository, remote, virtualDrive);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates on a folder from a offline folder', async () => {
    // Arrange
    const offlineFolder = OfflineFolderMother.random();
    const folder = FolderMother.fromPartial(offlineFolder.attributes());
    remote.persist.mockResolvedValueOnce(folder.attributes());

    // Act
    await SUT.run(offlineFolder);

    // Assert
    expect(repository.add).toBeCalledWith(
      expect.objectContaining({
        _id: new FolderId(folder.id),
        _parentId: new FolderId(folder.parentId ?? 0),
        _parentUuid: new FolderUuid(folder.parentUuid ?? ''),
        _path: new FolderPath(folder.path),
        _uuid: new FolderUuid(folder.uuid ?? ''),
      }),
    );
  });
});
