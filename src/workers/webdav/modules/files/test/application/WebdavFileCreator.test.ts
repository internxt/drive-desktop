import { FolderMother } from '../../../folders/test/domain/FolderMother';
import { FolderRepositoryMock } from '../../../folders/test/__mocks__/FolderRepositoryMock';
import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { WebdavFileCreator } from '../../application/WebdavFileCreator';
import { FileMetadataCollection } from '../../domain/FileMetadataCollection';
import { InMemoryTemporalFileMetadataCollection } from '../../infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { RemoteFileContentsManagersFactoryMock } from '../../../contents/test/__mocks__/RemoteFileContentsManagersFactoryMock';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';
import { ContentsIdMother } from '../../../contents/test/domain/ContentsIdMother';

describe('Webdav File Creator', () => {
  let fileReposiotry: FileRepositoryMock;
  let folderRepository: FolderRepositoryMock;
  let contentsRepository: RemoteFileContentsManagersFactoryMock;
  let temporalFileCollection: FileMetadataCollection;
  let eventBus: EventBusMock;
  let ipc: WebdavIpcMock;

  let SUT: WebdavFileCreator;

  beforeEach(() => {
    fileReposiotry = new FileRepositoryMock();
    folderRepository = new FolderRepositoryMock();
    const folderFinder = new WebdavFolderFinder(folderRepository);
    contentsRepository = new RemoteFileContentsManagersFactoryMock();
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
    const createdFileId = ContentsIdMother.raw();

    const folder = FolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.uploadMock.mockResolvedValueOnce(
      createdFileId
    );
    fileReposiotry.mockAdd.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, size);

    expect(contentsRepository.mockUpload.uploadMock).toBeCalledTimes(1);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].contentsId).toBe(
      createdFileId
    );
    expect(fileReposiotry.mockAdd.mock.calls[0][0].size).toStrictEqual(size);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].folderId).toBe(folder.id);
  });

  it('once the file entry is created the creation event should have been emitted', async () => {
    const path = '/cat.png';
    const size = 9715019333;
    const createdFileId = ContentsIdMother.raw();

    const folder = FolderMother.any();

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

    const folder = FolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.uploadMock.mockResolvedValueOnce('');

    const { stream } = await SUT.run(path, size);

    expect(stream.writable).toBe(true);
  });

  it('when the upload fails does not create a file', async () => {
    const path = '/cat.png';
    const size = 9715019333;

    const folder = FolderMother.any();

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
