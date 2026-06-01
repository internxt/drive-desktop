import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { opendir } from './opendir.service';
import { FilesByFolderPathSearcher } from '../../../../../context/virtual-drive/files/application/search/FilesByFolderPathSearcher';
import { FoldersByParentPathLister } from '../../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { TemporalFileByFolderFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByFolderFinder';
import { FolderNotFoundError } from '../../../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FILE_MODE, FOLDER_MODE } from '../../constants';
import type { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';

describe('opendir', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const fileSearcher = mockDeep<FilesByFolderPathSearcher>();
  const folderLister = mockDeep<FoldersByParentPathLister>();
  const temporalFinder = mockDeep<TemporalFileByFolderFinder>();

  beforeEach(() => {
    container = mockDeep<Container>();
    container.get.calledWith(FilesByFolderPathSearcher).mockReturnValue(fileSearcher);
    container.get.calledWith(FoldersByParentPathLister).mockReturnValue(folderLister);
    container.get.calledWith(TemporalFileByFolderFinder).mockReturnValue(temporalFinder);
    fileSearcher.run.mockResolvedValue([]);
    folderLister.run.mockResolvedValue([]);
    temporalFinder.run.mockResolvedValue([]);
  });

  describe('when directory has files and subfolders', () => {
    it('should return entries with correct modes', async () => {
      fileSearcher.run.mockResolvedValue(['file.txt', 'photo.jpg']);
      folderLister.run.mockResolvedValue(['subdir']);

      const { data, error } = await opendir('/some/folder', container);

      expect(error).toBeUndefined();
      expect(data?.entries).toStrictEqual([
        { name: 'file.txt', mode: FILE_MODE },
        { name: 'photo.jpg', mode: FILE_MODE },
        { name: 'subdir', mode: FOLDER_MODE },
      ]);
    });
  });

  describe('when directory has auxiliary temporal files', () => {
    it('should include only auxiliary temporal files in entries', async () => {
      const auxiliaryFile = mockDeep<TemporalFile>();
      auxiliaryFile.isAuxiliary.mockReturnValue(true);
      (auxiliaryFile as { name: string }).name = 'aux.tmp';

      const nonAuxiliaryFile = mockDeep<TemporalFile>();
      nonAuxiliaryFile.isAuxiliary.mockReturnValue(false);

      temporalFinder.run.mockResolvedValue([auxiliaryFile, nonAuxiliaryFile]);

      const { data, error } = await opendir('/some/folder', container);

      expect(error).toBeUndefined();
      expect(data?.entries).toStrictEqual([{ name: 'aux.tmp', mode: FILE_MODE }]);
    });
  });

  describe('when folder is not yet synced', () => {
    it('should return empty entries', async () => {
      folderLister.run.mockRejectedValue(new FolderNotFoundError('not synced'));

      const { data, error } = await opendir('/unsynced/folder', container);

      expect(error).toBeUndefined();
      expect(data?.entries).toStrictEqual([]);
    });
  });

  describe('when an unexpected error is thrown', () => {
    it('should return EIO', async () => {
      fileSearcher.run.mockRejectedValue(new Error('unexpected'));

      const { data, error } = await opendir('/some/folder', container);

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.EIO);
    });
  });
});
