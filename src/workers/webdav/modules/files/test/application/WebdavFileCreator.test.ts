import { WebdavFolderMother } from '../../../folders/test/domain/WebdavFolderMother';
import { WebdavFolderRepositoryMock } from '../../../folders/test/__mocks__/WebdavFolderRepositoryMock';
import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { WebdavFileCreator } from '../../application/WebdavFileCreator';
import { FileMetadataCollection } from '../../domain/FileMetadataCollection';
import { InMemoryTemporalFileMetadataCollection } from '../../infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { FileContentRepositoryMock } from '../__mocks__/FileContentRepositoryMock';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavIpcMock } from '../../../shared/infrastructure/__mock__/WebdavIPC';

describe('Webdav File Creator', () => {
  let fileReposiotry: WebdavFileRepositoryMock;
  let folderRepository: WebdavFolderRepositoryMock;
  let contentsRepository: FileContentRepositoryMock;
  let temporalFileCollection: FileMetadataCollection;
  let eventBus: EventBusMock;
  let ipc: WebdavIpcMock;

  let SUT: WebdavFileCreator;

  beforeEach(() => {
    fileReposiotry = new WebdavFileRepositoryMock();
    folderRepository = new WebdavFolderRepositoryMock();
    const folderFinder = new WebdavFolderFinder(folderRepository);
    contentsRepository = new FileContentRepositoryMock();
    temporalFileCollection = new InMemoryTemporalFileMetadataCollection();
    eventBus = new EventBusMock();
    ipc = new WebdavIpcMock();

    SUT = new WebdavFileCreator(
      fileReposiotry,
      folderFinder,
      contentsRepository,
      temporalFileCollection,
      eventBus,
      ipc
    );
  });

  it('uploads the file contents to the uploader and then creates the file on the drive server', async () => {
    const path = '/cat.png';
    const size = 9715019333;
    const createdFileId = 'd37800fc-43c8-529a-b02b-d41059921a15';

    const folder = WebdavFolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.uploadMock.mockResolvedValueOnce(
      createdFileId
    );
    fileReposiotry.mockAdd.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, size);

    expect(contentsRepository.mockUpload.uploadMock).toBeCalledTimes(1);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].fileId).toBe(createdFileId);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].size).toStrictEqual(size);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].folderId).toBe(folder.id);
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = '/cat.png';
    const size = 9715019333;
    const createdFileId = 'd37800fc-43c8-529a-b02b-d41059921a15';

    const folder = WebdavFolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.uploadMock.mockResolvedValueOnce(
      createdFileId
    );
    fileReposiotry.mockAdd.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    const { upload } = await SUT.run(path, size);

    await upload;

    expect(eventBus.publishMock.mock.calls[0][0][0].eventName).toBe(
      'webdav.file.created'
    );
    expect(eventBus.publishMock.mock.calls[0][0][0].aggregateId).toBe(
      createdFileId
    );
  });

  it('returns a writable stream when the file folder where is going to be created exists', async () => {
    const path = '/cat.png';
    const size = 9715019333;

    const folder = WebdavFolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.uploadMock.mockResolvedValueOnce('');

    const { stream } = await SUT.run(path, size);

    expect(stream.writable).toBe(true);
  });

  it('when the upload fails does not create a file', async () => {
    const path = '/cat.png';
    const size = 9715019333;

    const folder = WebdavFolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.uploadMock.mockRejectedValueOnce(
      'TEST ERROR'
    );

    try {
      await SUT.run(path, size);
    } catch (err) {
      expect(err).toBeDefined();
    }

    expect(fileReposiotry.mockAdd).not.toHaveBeenCalled();
  });
});
