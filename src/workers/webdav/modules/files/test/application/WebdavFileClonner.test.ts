import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { WebdavFolderMother } from '../../../folders/test/domain/WebdavFolderMother';
import { WebdavFolderRepositoryMock } from '../../../folders/test/__mocks__/WebdavFolderRepositoryMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavFileClonner } from '../../application/WebdavFileClonner';
import { FileAlreadyExistsError } from '../../domain/errors/FileAlreadyExistsError';
import { WebdavFileMother } from '../domain/WebdavFileMother';
import { FileContentRepositoryMock } from '../__mocks__/FileContentRepositoryMock';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';

describe('Webdav File Clonner', () => {
  const OVERWRITE = true;
  const NOT_OVERWRITE = false;

  let fileReposiotry: WebdavFileRepositoryMock;
  let folderRepository: WebdavFolderRepositoryMock;
  let contentsRepository: FileContentRepositoryMock;
  let eventBus: EventBusMock;

  let SUT: WebdavFileClonner;

  beforeEach(() => {
    fileReposiotry = new WebdavFileRepositoryMock();
    folderRepository = new WebdavFolderRepositoryMock();
    const folderFinder = new WebdavFolderFinder(folderRepository);
    contentsRepository = new FileContentRepositoryMock();
    eventBus = new EventBusMock();

    SUT = new WebdavFileClonner(
      fileReposiotry,
      folderFinder,
      contentsRepository,
      eventBus
    );
  });

  describe('destination path already exists', () => {
    it('duplicates a file and overwrites an exisiting one if already exist and overwrite flag is set', async () => {
      const file = WebdavFileMother.any();
      const folder = WebdavFolderMother.containing(file);
      const destinationPath = file.path;
      const fileToOverride = WebdavFileMother.fromPath(destinationPath);
      const clonnedFileId = '63bd1432-61a6-59e0-b6c1-9ee681b936e9';

      fileReposiotry.mockSearch.mockReturnValueOnce(fileToOverride);
      folderRepository.mockSearch.mockReturnValueOnce(folder);
      contentsRepository.mockClone.mockReturnValueOnce(clonnedFileId);
      fileReposiotry.mockAdd.mockImplementationOnce(() => {
        //
      });

      const hasBeenOverwritten = await SUT.run(
        file,
        destinationPath.value,
        OVERWRITE
      );

      expect(hasBeenOverwritten).toBe(true);
      expect(fileReposiotry.mockAdd.mock.calls[0][0].fileId).toBe(
        clonnedFileId
      );
      expect(fileReposiotry.mockAdd.mock.calls[0][0].path).toEqual(
        destinationPath
      );
      expect(eventBus.publishMock).toBeCalled();
      expect(eventBus.publishMock.mock.calls[0][0].length).toBe(2);
    });

    it('fails when the destination path already exists and overwrite flag is not set', async () => {
      const file = WebdavFileMother.any();

      fileReposiotry.mockSearch.mockReturnValueOnce(WebdavFileMother.any());

      expect(async () => {
        await SUT.run(file, '/destination/file', NOT_OVERWRITE);
      }).rejects.toThrow(FileAlreadyExistsError);
    });
  });

  describe('destination path does not exist', () => {
    it('duplicates a file given to the given path', async () => {
      const file = WebdavFileMother.any();
      const folder = WebdavFolderMother.containing(file);
      const destination = `${file.path.dirname()}/${file.name} (copy).${
        file.type
      }`;
      const clonnedFileId = '63bd1432-61a6-59e0-b6c1-9ee681b936e9';

      fileReposiotry.mockSearch.mockReturnValueOnce(undefined);
      folderRepository.mockSearch.mockReturnValueOnce(folder);
      contentsRepository.mockClone.mockReturnValueOnce(clonnedFileId);
      fileReposiotry.mockAdd.mockImplementationOnce(() => {
        //
      });

      const hasBeenOverwritten = await SUT.run(
        file,
        destination,
        NOT_OVERWRITE
      );

      expect(hasBeenOverwritten).toBe(false);
      expect(fileReposiotry.mockAdd.mock.calls[0][0].fileId).toBe(
        clonnedFileId
      );
      expect(fileReposiotry.mockAdd.mock.calls[0][0].path.value).toBe(
        destination
      );
      expect(eventBus.publishMock).toBeCalled();
    });
  });
});