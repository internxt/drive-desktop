import { FolderMother } from '../../../folders/test/domain/FolderMother';
import { FolderRepositoryMock } from '../../../folders/test/__mocks__/FolderRepositoryMock';
import { FolderFinder } from '../../../folders/application/FolderFinder';
import { FileCreator } from '../../application/FileCreator';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { FilePath } from '../../domain/FilePath';
import { FileContentsMother } from '../../../contents/test/domain/FileContentsMother';
import { FileDeleter } from '../../application/FileDeleter';
import { AllParentFoldersStatusIsExists } from '../../../folders/application/AllParentFoldersStatusIsExists';
import { PlaceholderCreatorMock } from '../../../placeholders/test/__mock__/PlaceholderCreatorMock';
import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
describe('File Creator', () => {
  let fileRepository: FileRepositoryMock;
  let folderRepository: FolderRepositoryMock;
  let fileDeleter: FileDeleter;
  let eventBus: EventBusMock;

  let SUT: FileCreator;

  const placeholderCreator = new PlaceholderCreatorMock();
  const ipc = new IpcRendererSyncEngineMock();

  beforeEach(() => {
    fileRepository = new FileRepositoryMock();
    folderRepository = new FolderRepositoryMock();
    const allParentFoldersStatusIsExists = new AllParentFoldersStatusIsExists(
      folderRepository
    );

    fileDeleter = new FileDeleter(
      fileRepository,
      allParentFoldersStatusIsExists,
      placeholderCreator,
      ipc
    );

    const folderFinder = new FolderFinder(folderRepository);
    eventBus = new EventBusMock();

    SUT = new FileCreator(fileRepository, folderFinder, fileDeleter, eventBus);
  });

  it('creates the file on the drive server', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const folder = FolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    fileRepository.mockAdd.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, contents);

    expect(fileRepository.mockAdd.mock.calls[0][0].contentsId).toBe(
      contents.id
    );
    expect(fileRepository.mockAdd.mock.calls[0][0].size).toStrictEqual(
      contents.size
    );
    expect(fileRepository.mockAdd.mock.calls[0][0].folderId).toBe(folder.id);
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const folder = FolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    fileRepository.mockAdd.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, contents);

    expect(eventBus.publishMock.mock.calls[0][0][0].eventName).toBe(
      'webdav.file.created'
    );
    expect(eventBus.publishMock.mock.calls[0][0][0].aggregateId).toBe(
      contents.id
    );
  });
});
