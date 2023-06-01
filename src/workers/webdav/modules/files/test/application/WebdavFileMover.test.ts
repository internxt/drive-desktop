import { WebdavFolderFinder } from '../../../folders/application/WebdavFolderFinder';
import { WebdavFolderMother } from '../../../folders/test/domain/WebdavFolderMother';
import { WebdavFolderRepositoryMock } from '../../../folders/test/__mocks__/WebdavFolderRepositoryMock';
import { WebdavFileMover } from '../../application/WebdavFileMover';
import { WebdavFileMother } from '../domain/WebdavFileMother';
import { WebdavFileRepositoryMock } from '../__mocks__/WebdavFileRepositoyMock';

describe('Webdav File Mover', () => {
  let repository: WebdavFileRepositoryMock;
  let folderRepository: WebdavFolderRepositoryMock;
  let folderFinder: WebdavFolderFinder;
  let SUT: WebdavFileMover;

  beforeEach(() => {
    repository = new WebdavFileRepositoryMock();
    folderRepository = new WebdavFolderRepositoryMock();
    folderFinder = new WebdavFolderFinder(folderRepository);
    SUT = new WebdavFileMover(repository, folderFinder);
  });

  describe('Move', () => {
    it('moves a file when the destination folder does not contain a file with the same path', async () => {
      const file = WebdavFileMother.any();
      const destination = `${file.path.dirname()}/_${file.path.nameWithExtension()}`;
      const override = false;

      folderRepository.mockSearch.mockImplementation(() =>
        WebdavFolderMother.any()
      );

      repository.mockSearch.mockImplementation(() => undefined);
      repository.mockUpdateName.mockImplementation(() => Promise.resolve());

      const hasBeenOverriden = await SUT.run(file, destination, override);

      expect(hasBeenOverriden).toBe(false);
      expect(folderRepository.mockSearch).toHaveBeenCalledWith(
        file.path.dirname()
      );
      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockUpdateParentDir).toHaveBeenCalled();
    });

    it('when a file on the destination already exists but the overwite flag is not set to true the move fails', async () => {
      const file = WebdavFileMother.any();
      const destination = `${file.path.dirname()}/_${file.path.nameWithExtension()}`;
      const override = false;

      repository.mockSearch.mockImplementation(() => file);

      try {
        const hasBeenOverriden = await SUT.run(file, destination, override);
        expect(hasBeenOverriden).not.toBeDefined();
      } catch (err) {
        expect(err).toBeDefined();
        expect((err as Error).message).toBe('File already exists');
      }

      expect(folderRepository.mockSearch).not.toHaveBeenCalled();
      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockUpdateParentDir).not.toHaveBeenCalled();
    });

    it('when a file on the destination already exists and the overwite flag is set to true the old file gets trashed', async () => {
      const file = WebdavFileMother.any();
      const existing = WebdavFileMother.onFolderName('Ubuwevzuj');
      const destination = `${existing.path.dirname()}/_${file.path.nameWithExtension()}`;

      const override = true;

      repository.mockSearch.mockImplementation(() => existing);
      folderRepository.mockSearch.mockImplementation(() =>
        WebdavFolderMother.containing(existing)
      );

      const hasBeenOverriden = await SUT.run(file, destination, override);
      expect(hasBeenOverriden).toBe(true);

      expect(folderRepository.mockSearch).toHaveBeenCalled();
      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockDelete).toHaveBeenCalled();
      expect(repository.mockUpdateParentDir).toHaveBeenCalled();
    });
  });

  describe('Rename', () => {
    it('when a file is moved to the same folder its renamed', async () => {
      const file = WebdavFileMother.any();
      const destination = `${file.path.dirname()}/_${file.path.nameWithExtension()}`;
      const override = false;

      folderRepository.mockSearch.mockImplementation(() =>
        WebdavFolderMother.containing(file)
      );

      repository.mockSearch.mockImplementation(() => undefined);
      repository.mockUpdateName.mockImplementation(() => Promise.resolve());

      const hasBeenOverriden = await SUT.run(file, destination, override);

      expect(hasBeenOverriden).toBe(false);
      expect(folderRepository.mockSearch).toHaveBeenCalledWith(
        file.path.dirname()
      );
      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockUpdateName).toHaveBeenCalled();
    });

    it('a file cannot be renamed even with the overwite flag', async () => {
      const file = WebdavFileMother.any();
      const destination = `${file.path.dirname()}/_${file.path.nameWithExtension()}`;
      const override = true;

      folderRepository.mockSearch.mockImplementation(() =>
        WebdavFolderMother.containing(file)
      );
      repository.mockSearch.mockImplementation(() => WebdavFileMother.any());

      try {
        const hasBeenOverriden = await SUT.run(file, destination, override);
        expect(hasBeenOverriden).not.toBeDefined();
      } catch (err) {
        expect(err).toBeDefined();
      }

      expect(repository.mockSearch).toHaveBeenCalledWith(destination);
      expect(repository.mockUpdateName).not.toHaveBeenCalled();
    });
  });
});
