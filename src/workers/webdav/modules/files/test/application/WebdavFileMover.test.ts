import { EventBusMock } from '../../../shared/test/__mock__/EventBusMock';
import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { FolderMother } from '../../../folders/test/domain/FolderMother';
import { FolderRepositoryMock } from '../../../folders/test/__mocks__/FolderRepositoryMock';
import { WebdavFileMover } from '../../application/WebdavFileMover';
import { FileAlreadyExistsError } from '../../domain/errors/FileAlreadyExistsError';
import { FileMother } from '../domain/FileMother';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';
import { FilePath } from '../../domain/FilePath';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';
import { WebdavFileRenamer } from '../../application/WebdavFileRenamer';
import { RemoteFileContentsManagersFactoryMock } from '../../../contents/test/__mocks__/RemoteFileContentsManagersFactoryMock';
import path from 'path';

describe('Webdav File Mover', () => {
  let repository: FileRepositoryMock;
  let folderRepository: FolderRepositoryMock;
  let folderFinder: WebdavFolderFinder;
  let fileRenamer: WebdavFileRenamer;
  let contentsRepository: RemoteFileContentsManagersFactoryMock;
  let eventBus: EventBusMock;
  let ipc: WebdavIpcMock;

  let SUT: WebdavFileMover;

  beforeEach(() => {
    repository = new FileRepositoryMock();
    folderRepository = new FolderRepositoryMock();
    folderFinder = new WebdavFolderFinder(folderRepository);
    contentsRepository = new RemoteFileContentsManagersFactoryMock();
    eventBus = new EventBusMock();
    ipc = new WebdavIpcMock();

    fileRenamer = new WebdavFileRenamer(
      repository,
      contentsRepository,
      folderFinder
    );

    SUT = new WebdavFileMover(
      repository,
      folderFinder,
      fileRenamer,
      eventBus,
      ipc
    );
  });

  describe('Move', () => {
    it('moves a file when does not exists a file with the desired path', async () => {
      const file = FileMother.any();
      const desiredPath = new FilePath(
        path.join(file.dirname, `_${file.nameWithExtension}`)
      );
      const override = false;

      folderRepository.mockSearch.mockImplementation(() => FolderMother.any());

      repository.mockSearch.mockImplementation(() => undefined);
      repository.mockUpdateName.mockImplementation(() => Promise.resolve());

      const hasBeenOverwritten = await SUT.run(
        file,
        desiredPath.value,
        override
      );

      expect(hasBeenOverwritten).toBe(false);
      expect(folderRepository.mockSearch).toHaveBeenCalledWith(
        desiredPath.dirname()
      );
      expect(repository.mockSearch).toHaveBeenCalledWith(desiredPath);
      expect(repository.mockUpdateParentDir).toHaveBeenCalled();
    });

    it('when a file on the destination already exists but the overwite flag is not set to true the move fails', async () => {
      const file = FileMother.any();
      const destination = new FilePath(
        path.join(file.dirname, `_${file.nameWithExtension}`)
      );
      const override = false;

      repository.mockSearch.mockImplementation(() => file);

      try {
        const hasBeenOverwritten = await SUT.run(
          file,
          destination.value,
          override
        );
        expect(hasBeenOverwritten).not.toBeDefined();
      } catch (err) {
        expect(err).toBeDefined();
        expect(err instanceof FileAlreadyExistsError).toBe(true);
      }

      expect(folderRepository.mockSearch).not.toHaveBeenCalled();
      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockUpdateParentDir).not.toHaveBeenCalled();
    });

    it('when a file on the destination already exists and the overwite flag is set to true the old file gets trashed', async () => {
      const file = FileMother.any();
      const existing = FileMother.onFolderName('Ubuwevzuj');
      const destination = new FilePath(
        path.join(existing.dirname, `_${file.nameWithExtension}`)
      );

      const override = true;

      repository.mockSearch.mockImplementation(() => existing);
      folderRepository.mockSearch.mockImplementation(() =>
        FolderMother.containing(existing)
      );

      const hasBeenOverwritten = await SUT.run(
        file,
        destination.value,
        override
      );
      expect(hasBeenOverwritten).toBe(true);

      expect(folderRepository.mockSearch).toHaveBeenCalled();
      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockDelete).toHaveBeenCalled();
      expect(repository.mockUpdateParentDir).toHaveBeenCalled();
    });
  });

  describe('Rename', () => {
    it('when a file is moved to the same folder its renamed', async () => {
      const file = FileMother.any();
      const destination = new FilePath(
        path.join(file.dirname, `_${file.nameWithExtension}`)
      );
      const override = false;

      folderRepository.mockSearch.mockImplementation(() =>
        FolderMother.containing(file)
      );

      repository.mockSearch.mockImplementation(() => undefined);
      repository.mockUpdateName.mockImplementation(() => Promise.resolve());

      const hasBeenOverwritten = await SUT.run(
        file,
        destination.value,
        override
      );

      expect(hasBeenOverwritten).toBe(false);
      expect(folderRepository.mockSearch).toHaveBeenCalledWith(file.dirname);
      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockUpdateName).toHaveBeenCalled();
    });

    it('a file cannot be renamed even with the overwite flag', async () => {
      const file = FileMother.any();
      const destination = new FilePath(
        path.join(file.dirname, `_${file.nameWithExtension}`)
      );
      const override = true;

      folderRepository.mockSearch.mockImplementation(() =>
        FolderMother.containing(file)
      );
      repository.mockSearch.mockImplementation(() => FileMother.any());

      try {
        const hasBeenOverwritten = await SUT.run(
          file,
          destination.value,
          override
        );
        expect(hasBeenOverwritten).not.toBeDefined();
      } catch (err) {
        expect(err).toBeDefined();
      }

      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockUpdateName).not.toHaveBeenCalled();
    });
  });
});
