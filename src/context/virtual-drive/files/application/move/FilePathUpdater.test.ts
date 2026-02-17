import { FilePathUpdater } from './FilePathUpdater';
import { FilePath } from '../../domain/FilePath';
import { ParentFolderFinder } from '../../../folders/application/ParentFolderFinder';
import { ParentFolderFinderTestClass } from '../../../folders/__test-helpers__/ParentFolderFinderTestClass';

import { FileRepositoryMock } from '../../__mocks__/FileRepositoryMock';
import { SingleFileMatchingTestClass } from '../../__test-helpers__/SingleFileMatchingTestClass';
import { FileMother } from '../../domain/__test-helpers__/FileMother';
import { EventBusMock } from '../../../../../context/virtual-drive/shared/__mocks__/EventBusMock';
import { FolderMother } from '../../../../../context/virtual-drive/folders/domain/__test-helpers__/FolderMother';
import * as renameFileModule from '../../../../../infra/drive-server/services/files/services/rename-file';
import * as moveFileModule from '../../../../../infra/drive-server/services/files/services/move-file';
import { call, partialSpyOn } from '../../../../../../tests/vitest/utils.helper';

describe('File path updater', () => {
  let repository: FileRepositoryMock;
  let folderFinder: ParentFolderFinderTestClass;
  let singleFileMatchingTestClass: SingleFileMatchingTestClass;
  let eventBus: EventBusMock;
  let SUT: FilePathUpdater;

  const renameFileMock = partialSpyOn(renameFileModule, 'renameFile');
  const moveFileMock = partialSpyOn(moveFileModule, 'moveFile');

  beforeEach(() => {
    repository = new FileRepositoryMock();
    folderFinder = new ParentFolderFinderTestClass();
    singleFileMatchingTestClass = new SingleFileMatchingTestClass();
    eventBus = new EventBusMock();

    SUT = new FilePathUpdater(
      repository,
      singleFileMatchingTestClass,
      folderFinder as unknown as ParentFolderFinder,
      eventBus,
    );
  });

  it('renames a file when the extension and folder does not change', async () => {
    const fileToRename = FileMother.any();

    singleFileMatchingTestClass.mock.mockReturnValueOnce(fileToRename);
    repository.matchingPartialMock.mockReturnValueOnce([]);

    const destination = new FilePath(`${fileToRename.dirname}/_${fileToRename.nameWithExtension}`);

    await SUT.run(fileToRename.contentsId, destination.value);

    expect(repository.updateMock).toBeCalledWith(expect.objectContaining({ path: destination.value }));
    call(renameFileMock).toStrictEqual({
      fileUuid: fileToRename.uuid,
      plainName: destination.name(),
      type: fileToRename.type,
    });
  });

  it('does not rename or moves a file when the extension changes', async () => {
    const fileToRename = FileMother.any();
    const fileWithDestinationPath = undefined;

    singleFileMatchingTestClass.mock.mockReturnValueOnce(fileToRename).mockReturnValueOnce(fileWithDestinationPath);

    const destination = new FilePath(`${fileToRename.dirname}/_${fileToRename.nameWithExtension}n`);

    await expect(async () => {
      await SUT.run(fileToRename.contentsId, destination.value);
    }).rejects.toThrow();
  });

  it('moves a file when the folder changes', async () => {
    const fileToMove = FileMother.any();
    const fileInDestination = undefined;

    singleFileMatchingTestClass.mock.mockReturnValueOnce(fileToMove).mockReturnValueOnce(fileInDestination);

    const destination = new FilePath(`${fileToMove.dirname}_/${fileToMove.nameWithExtension}`);

    const destinationFolder = FolderMother.fromPartial({
      id: fileToMove.folderId + 1,
      path: destination.dirname(),
    });

    folderFinder.mock.mockReturnValueOnce(destinationFolder);

    await SUT.run(fileToMove.contentsId, destination.value);

    expect(repository.updateMock).toBeCalledWith(
      expect.objectContaining({
        folderId: destinationFolder.id,
        path: destination.value,
      }),
    );
    call(moveFileMock).toStrictEqual({
      uuid: fileToMove.uuid,
      destinationFolder: destinationFolder.uuid,
    });
  });
});
