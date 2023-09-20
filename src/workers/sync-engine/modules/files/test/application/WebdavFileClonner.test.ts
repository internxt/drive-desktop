import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { FolderMother } from '../../../folders/test/domain/FolderMother';
import { FolderRepositoryMock } from '../../../folders/test/__mocks__/FolderRepositoryMock';
import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavFileCloner } from '../../application/WebdavFileCloner';
import { FileAlreadyExistsError } from '../../domain/errors/FileAlreadyExistsError';
import { FileMother } from '../domain/FileMother';
import { RemoteFileContentsManagersFactoryMock } from '../../../contents/test/__mocks__/RemoteFileContentsManagersFactoryMock';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { ContentsIdMother } from '../../../contents/test/domain/ContentsIdMother';

describe('Webdav File Cloner', () => {
  const OVERWRITE = true;
  const NOT_OVERWRITE = false;

  let fileRepository: FileRepositoryMock;
  let folderRepository: FolderRepositoryMock;
  let contentsRepository: RemoteFileContentsManagersFactoryMock;
  let eventBus: EventBusMock;
  let ipc: IpcRendererSyncEngineMock;

  let SUT: WebdavFileCloner;

  beforeEach(() => {
    fileRepository = new FileRepositoryMock();
    folderRepository = new FolderRepositoryMock();
    const folderFinder = new WebdavFolderFinder(folderRepository);
    contentsRepository = new RemoteFileContentsManagersFactoryMock();
    eventBus = new EventBusMock();
    ipc = new IpcRendererSyncEngineMock();

    SUT = new WebdavFileCloner(
      fileRepository,
      folderFinder,
      contentsRepository,
      eventBus,
      ipc
    );
  });

  describe('destination path already exists', () => {
    it('duplicates a file and overwrites an existing one if already exist and overwrite flag is set', async () => {
      const file = FileMother.any();
      const folder = FolderMother.containing(file);
      const destinationPath = file.path;
      const fileToOverride = FileMother.fromPath(destinationPath.value);
      const clonedContentsId = ContentsIdMother.random();

      fileRepository.mockSearch.mockReturnValueOnce(fileToOverride);
      folderRepository.mockSearch.mockReturnValueOnce(folder);
      contentsRepository.mockClone.mock.mockReturnValueOnce(clonedContentsId);
      fileRepository.mockAdd.mockImplementationOnce(() => {
        //
      });

      const hasBeenOverwritten = await SUT.run(
        file,
        file.path.value,
        OVERWRITE
      );

      expect(hasBeenOverwritten).toBe(true);
      expect(fileRepository.mockAdd.mock.calls[0][0].contentsId).toBe(
        clonedContentsId.value
      );
      expect(fileRepository.mockAdd.mock.calls[0][0].path).toEqual(
        destinationPath
      );
      expect(eventBus.publishMock).toBeCalled();
      expect(eventBus.publishMock).toBeCalledTimes(2);
    });

    it('fails when the destination path already exists and overwrite flag is not set', async () => {
      const file = FileMother.any();

      fileRepository.mockSearch.mockReturnValueOnce(FileMother.any());

      expect(async () => {
        await SUT.run(file, '/destination/file', NOT_OVERWRITE);
      }).rejects.toThrow(FileAlreadyExistsError);
    });
  });

  describe('destination path does not exist', () => {
    it('duplicates a file given to the given path', async () => {
      const file = FileMother.any();
      const folder = FolderMother.containing(file);
      const destination = `${file.dirname}/${file.name} (copy).${file.type}`;
      const clonedContentsId = ContentsIdMother.random();

      fileRepository.mockSearch.mockReturnValueOnce(undefined);
      folderRepository.mockSearch.mockReturnValueOnce(folder);
      contentsRepository.mockClone.mock.mockReturnValueOnce(clonedContentsId);
      fileRepository.mockAdd.mockImplementationOnce(() => {
        //
      });

      const hasBeenOverwritten = await SUT.run(
        file,
        destination,
        NOT_OVERWRITE
      );

      expect(hasBeenOverwritten).toBe(false);
      expect(fileRepository.mockAdd.mock.calls[0][0].contentsId).toBe(
        clonedContentsId.value
      );
      expect(fileRepository.mockAdd.mock.calls[0][0].path.value).toBe(
        destination
      );
      expect(eventBus.publishMock).toBeCalled();
    });
  });
});
