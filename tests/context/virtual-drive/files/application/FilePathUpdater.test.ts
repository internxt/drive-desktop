import { mockDeep } from 'vitest-mock-extended';
import { FilePathUpdater } from '../../../../../src/context/virtual-drive/files/application/FilePathUpdater';
import { FilePath } from '../../../../../src/context/virtual-drive/files/domain/FilePath';
import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { FolderMother } from '../../folders/domain/FolderMother';
import { FileMother } from '../domain/FileMother';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked } from 'tests/vitest/utils.helper.test';

describe('File path updater', () => {
  const repository = mockDeep<InMemoryFileRepository>();
  const folderFinder = mockDeep<FolderFinder>();
  const renameFileMock = deepMocked(driveServerWip.files.renameFile);
  const moveFileMock = deepMocked(driveServerWip.files.moveFile);

  const SUT = new FilePathUpdater(repository, folderFinder);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renames a file when the extension and folder does not change', async () => {
    const fileToRename = FileMother.any();
    const fileWithDestinationPath = undefined;

    const folderFather = FolderMother.fromPartial({
      path: fileToRename.dirname,
    });

    repository.searchByPartial.mockReturnValueOnce(fileToRename).mockReturnValueOnce(fileWithDestinationPath);

    folderFinder.findFromUuid.mockReturnValueOnce(folderFather);

    const destination = new FilePath(`${fileToRename.dirname}/_${fileToRename.nameWithExtension}`);

    await SUT.run(fileToRename.contentsId, destination.value);

    expect(repository.update).toBeCalledWith(expect.objectContaining({ path: destination.value }));
    expect(renameFileMock).toBeCalledWith(expect.objectContaining({ name: fileToRename.name }));
  });

  it('does not rename or moves a file when the extension changes', () => {
    const fileToRename = FileMother.any();
    const fileWithDestinationPath = undefined;

    repository.searchByPartial.mockReturnValueOnce(fileToRename).mockReturnValueOnce(fileWithDestinationPath);

    const destination = new FilePath(`${fileToRename.dirname}/_${fileToRename.nameWithExtension}n`);

    void expect(async () => {
      await SUT.run(fileToRename.contentsId, destination.value);
    }).rejects.toThrow();
  });

  it('moves a file when the folder changes', async () => {
    const fileToMove = FileMother.any();
    const fileInDestination = undefined;

    const folderFather = FolderMother.fromPartial({
      path: fileToMove.dirname,
    });

    folderFinder.findFromUuid.mockReturnValueOnce(folderFather);

    repository.searchByPartial.mockReturnValueOnce(fileToMove).mockReturnValueOnce(fileInDestination);

    const destination = new FilePath(`${fileToMove.dirname}_/${fileToMove.nameWithExtension}`);

    const destinationFolder = FolderMother.fromPartial({
      id: fileToMove.folderId.value + 1,
      path: destination.dirname(),
    });

    folderFinder.run.mockReturnValueOnce(destinationFolder);

    await SUT.run(fileToMove.contentsId, destination.value);

    expect(repository.update).toBeCalledWith(expect.objectContaining(fileToMove));
    expect(moveFileMock).toBeCalledWith(
      expect.objectContaining({
        uuid: fileToMove.uuid,
        parentUuid: destinationFolder.uuid,
      }),
    );
  });
});
