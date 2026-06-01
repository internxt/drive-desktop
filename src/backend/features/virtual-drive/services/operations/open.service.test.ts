import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { open } from './open.service';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import type { File } from '../../../../../context/virtual-drive/files/domain/File';

describe('open', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const fileSearcher = mockDeep<FirstsFileSearcher>();
  const temporalFinder = mockDeep<TemporalFileByPathFinder>();

  beforeEach(() => {
    container = mockDeep<Container>();
    container.get.calledWith(FirstsFileSearcher).mockReturnValue(fileSearcher);
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(temporalFinder);
    fileSearcher.run.mockResolvedValue(undefined);
    temporalFinder.run.mockResolvedValue(undefined);
  });

  describe('when a virtual file is found', () => {
    it('should return success', async () => {
      fileSearcher.run.mockResolvedValue({} as unknown as File);

      const { data, error } = await open('/some/file.txt', 'cat', container);

      expect(error).toBeUndefined();
      expect(data).toBeUndefined();
    });
  });

  describe('when a temporal file is found', () => {
    it('should return success', async () => {
      temporalFinder.run.mockResolvedValue({} as unknown as TemporalFile);

      const { data, error } = await open('/some/file.txt', 'cat', container);

      expect(error).toBeUndefined();
      expect(data).toBeUndefined();
    });
  });

  describe('when no file is found', () => {
    it('should return ENOENT', async () => {
      const { data, error } = await open('/missing/file.txt', 'cat', container);

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.ENOENT);
    });
  });

  describe('when an unexpected error is thrown on a non-temporary path', () => {
    it('should return EIO', async () => {
      fileSearcher.run.mockRejectedValue(new Error('unexpected'));

      const { data, error } = await open('/some/file.txt', 'cat', container);

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.EIO);
    });
  });

  describe('when an unexpected error is thrown on a temporary path', () => {
    it('should return EEXIST', async () => {
      fileSearcher.run.mockRejectedValue(new Error('unexpected'));
      vi.spyOn(TemporalFile, 'isTemporaryPath').mockReturnValue(true);

      const { data, error } = await open('/some/.tmp123', 'cat', container);

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.EEXIST);
    });
  });
});
