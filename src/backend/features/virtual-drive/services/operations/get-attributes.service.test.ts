import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { getAttributes } from './get-attributes.service';
import { FILE_MODE, FOLDER_MODE } from '../../constants';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { SingleFolderMatchingSearcher } from '../../../../../context/virtual-drive/folders/application/SingleFolderMatchingSearcher';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import type { File } from '../../../../../context/virtual-drive/files/domain/File';
import type { Folder } from '../../../../../context/virtual-drive/folders/domain/Folder';
import type { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';

vi.mock('@internxt/drive-desktop-core/build/backend');

describe('getAttributes', () => {
  let now: Date;
  let container: ReturnType<typeof mockDeep<Container>>;
  const fileSearcher = mockDeep<FirstsFileSearcher>();
  const folderSearcher = mockDeep<SingleFolderMatchingSearcher>();
  const temporalFinder = mockDeep<TemporalFileByPathFinder>();

  beforeEach(() => {
    now = new Date();
    container = mockDeep<Container>();
    container.get.calledWith(FirstsFileSearcher).mockReturnValue(fileSearcher);
    fileSearcher.run.mockResolvedValue(undefined);
    folderSearcher.run.mockResolvedValue(undefined);
  });

  describe('when path is root', () => {
    it('should return folder attributes for "/"', async () => {
      const { data, error } = await getAttributes('/', container);

      expect(error).toBeUndefined();
      expect(data).toMatchObject({ mode: FOLDER_MODE, size: 0, nlink: 2 });
    });

    it('should return folder attributes for empty string', async () => {
      const { data, error } = await getAttributes('', container);

      expect(error).toBeUndefined();
      expect(data).toMatchObject({ mode: FOLDER_MODE, size: 0, nlink: 2 });
    });
  });

  describe('when a file is found', () => {
    it('should return file attributes', async () => {
      fileSearcher.run.mockResolvedValue({ size: 4096, createdAt: now, updatedAt: now } as unknown as File);

      const { data, error } = await getAttributes('/some/file.txt', container);

      expect(error).toBeUndefined();
      expect(data).toMatchObject({ mode: FILE_MODE, size: 4096, nlink: 1 });
    });
  });

  describe('when a folder is found', () => {
    it('should return folder attributes', async () => {
      folderSearcher.run.mockResolvedValue({ createdAt: now, updatedAt: now } as unknown as Folder);
      container.get.calledWith(SingleFolderMatchingSearcher).mockReturnValue(folderSearcher);

      const { data, error } = await getAttributes('/some/folder', container);

      expect(error).toBeUndefined();
      expect(data).toMatchObject({ mode: FOLDER_MODE, size: 0, nlink: 2 });
    });
  });

  describe('when a temporal file is found', () => {
    it('should return file attributes', async () => {
      container.get.calledWith(SingleFolderMatchingSearcher).mockReturnValue(folderSearcher);

      temporalFinder.run.mockResolvedValue({ size: { value: 2048 }, createdAt: now } as unknown as TemporalFile);
      container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFinder);

      const { data, error } = await getAttributes('/some/temp.txt', container);

      expect(error).toBeUndefined();
      expect(data).toMatchObject({ mode: FILE_MODE, size: 2048, nlink: 1 });
    });
  });

  describe('when nothing is found', () => {
    it('should return ENOENT error', async () => {
      container.get.calledWith(SingleFolderMatchingSearcher).mockReturnValue(folderSearcher);

      temporalFinder.run.mockResolvedValue(undefined);
      container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFinder);

      const { data, error } = await getAttributes('/missing/file.txt', container);

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.ENOENT);
    });
  });
});
