import { FolderMother } from '../../../folders/test/domain/FolderMother';
import { FolderRepositoryMock } from '../../../folders/test/__mocks__/FolderRepositoryMock';
import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { FileCreator } from '../../application/FileCreator';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { FilePath } from '../../domain/FilePath';
import { FileContentsMother } from '../../../contents/test/domain/FileContentsMother';

describe('File Creator', () => {
  let fileReposiotry: FileRepositoryMock;
  let folderRepository: FolderRepositoryMock;
  let eventBus: EventBusMock;

  let SUT: FileCreator;

  beforeEach(() => {
    fileReposiotry = new FileRepositoryMock();
    folderRepository = new FolderRepositoryMock();
    const folderFinder = new WebdavFolderFinder(folderRepository);
    eventBus = new EventBusMock();

    SUT = new FileCreator(fileReposiotry, folderFinder, eventBus);
  });

  it('creates the file on the drive server', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const folder = FolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    fileReposiotry.mockAdd.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, contents);

    expect(fileReposiotry.mockAdd.mock.calls[0][0].contentsId).toBe(
      contents.id
    );
    expect(fileReposiotry.mockAdd.mock.calls[0][0].size).toStrictEqual(
      contents.size
    );
    expect(fileReposiotry.mockAdd.mock.calls[0][0].folderId).toBe(folder.id);
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = new FilePath('/cat.png');
    const contents = FileContentsMother.random();

    const folder = FolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    fileReposiotry.mockAdd.mockImplementationOnce(() => {
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
