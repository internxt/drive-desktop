import { WebdavFolderMother } from '../../../folders/test/domain/WebdavFolderMother';
import { WebdavFolderRepositoryMock } from '../../../folders/test/__mocks__/WebdavFolderRepositoryMock';
import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { WebdavFileCreator } from '../../application/WebdavFileCreator';
import { FileMetadataCollection } from '../../domain/FileMetadataCollection';
import { InMemoryTemporalFileMetadataCollection } from '../../infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { FileContentRepositoryMock } from '../__mocks__/FileContentRepositoryMock';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';

describe('Webdav File Creator', () => {
  let fileReposiotry: WebdavFileRepositoryMock;
  let folderRepository: WebdavFolderRepositoryMock;
  let contentsRepository: FileContentRepositoryMock;
  let temporalFileCollection: FileMetadataCollection;

  let SUT: WebdavFileCreator;

  beforeEach(() => {
    fileReposiotry = new WebdavFileRepositoryMock();
    folderRepository = new WebdavFolderRepositoryMock();
    const folderFinder = new WebdavFolderFinder(folderRepository);
    contentsRepository = new FileContentRepositoryMock();
    temporalFileCollection = new InMemoryTemporalFileMetadataCollection();

    SUT = new WebdavFileCreator(
      fileReposiotry,
      folderFinder,
      contentsRepository,
      temporalFileCollection
    );
  });

  it('uploads the file contents to the uploader and then creates the file on the drive server', async () => {
    const path = '/cat.png';
    const size = 9715019333;
    const createdFileId = 'd37800fc-43c8-529a-b02b-d41059921a15';

    const folder = WebdavFolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.mockResolvedValueOnce(createdFileId);
    fileReposiotry.mockAdd.mockImplementationOnce(() => {
      // returns Promise<void>
    });

    await SUT.run(path, size);

    expect(contentsRepository.mockUpload).toBeCalledTimes(1);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].fileId).toBe(createdFileId);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].size).toBe(size);
    expect(fileReposiotry.mockAdd.mock.calls[0][0].folderId).toBe(folder.id);
  });

  it('returns a writable stream when the file folder where is going to be created exists', async () => {
    const path = '/cat.png';
    const size = 9715019333;

    const folder = WebdavFolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.mockResolvedValueOnce('');

    const stream = await SUT.run(path, size);

    expect(stream.writable).toBe(true);
  });

  it('when the upload fails does not create a file', async () => {
    const path = '/cat.png';
    const size = 9715019333;

    const folder = WebdavFolderMother.any();

    folderRepository.mockSearch.mockReturnValueOnce(folder);
    contentsRepository.mockUpload.mockRejectedValueOnce('TEST ERROR');

    try {
      await SUT.run(path, size);
    } catch (err) {
      expect(err).toBeDefined();
    }

    expect(fileReposiotry.mockAdd).not.toHaveBeenCalled();
  });
});
