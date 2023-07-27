import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { WebdavFolderRepositoryMock } from '../../../folders/test/__mocks__/WebdavFolderRepositoryMock';
import { WebdavEmptyFileCreator } from '../../application/WebdavEmptyFileCreator';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';
import { FileSize } from '../../domain/FileSize';
import { WebdavFolderMother } from '../../../folders/test/domain/WebdavFolderMother';

describe('Webdav Empty File Creator', () => {
  let repository: WebdavFileRepositoryMock;
  let folderRepository: WebdavFolderRepositoryMock;
  let folderFinder: WebdavFolderFinder;
  let eventBus: EventBusMock;
  let ipc: WebdavIpcMock;

  let SUT: WebdavEmptyFileCreator;

  beforeEach(() => {
    repository = new WebdavFileRepositoryMock();
    folderRepository = new WebdavFolderRepositoryMock();
    folderFinder = new WebdavFolderFinder(folderRepository);
    eventBus = new EventBusMock();
    ipc = new WebdavIpcMock();

    SUT = new WebdavEmptyFileCreator(repository, folderFinder, eventBus, ipc);
  });

  it('creates a file with size 0', async () => {
    const folderId = 606950194;
    repository.mockAdd.mockReturnValueOnce(Promise.resolve());
    folderRepository.mockSearch.mockReturnValue(
      WebdavFolderMother.fromPartials({ id: folderId })
    );

    await SUT.run('/Pakunek/Tihnevo.png');

    expect(repository.mockAdd).toBeCalledWith(
      expect.objectContaining({
        _size: new FileSize(0),
        _folderId: folderId,
      })
    );
  });

  it('emits file created event', async () => {
    repository.mockAdd.mockReturnValueOnce(Promise.resolve());
    folderRepository.mockSearch.mockReturnValue(WebdavFolderMother.any());

    await SUT.run('/Pakunek/Tihnevo.png');

    expect(eventBus.publishMock).toBeCalled();
  });

  it('sends and event to the ui', async () => {
    repository.mockAdd.mockReturnValueOnce(Promise.resolve());
    folderRepository.mockSearch.mockReturnValue(WebdavFolderMother.any());

    await SUT.run('/Pakunek/Tihnevo.png');

    expect(ipc.sendMock).toBeCalledWith('WEBDAV_FILE_CREATED', {
      name: 'Tihnevo',
      extension: 'png',
      nameWithExtension: 'Tihnevo.png',
      size: 0,
    });
  });
});
