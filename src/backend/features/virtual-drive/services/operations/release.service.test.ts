import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { release } from './release.service';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileUploader } from '../../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { TemporalFileDeleter } from '../../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { File, FileAttributes } from '../../../../../context/virtual-drive/files/domain/File';
import { ContentsId } from '../../../../../apps/main/database/entities/DriveFile';
import { FileStatuses } from '../../../../../context/virtual-drive/files/domain/FileStatus';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { call, calls } from '../../../../../../tests/vitest/utils.helper';

const fileAttrs: FileAttributes = {
  id: 1,
  uuid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  contentsId: 'aabbccddeeff001122334455',
  folderId: 0,
  createdAt: new Date().toISOString(),
  modificationTime: new Date().toISOString(),
  path: '/Documents/report.pdf',
  size: 100,
  updatedAt: new Date().toISOString(),
  status: FileStatuses.EXISTS,
};

function createTemporalFile(path: string): TemporalFile {
  return TemporalFile.from({ path, size: 100, createdAt: new Date(), modifiedAt: new Date() });
}

function createAuxiliaryFile(path: string): TemporalFile {
  return TemporalFile.from({ path, size: 0, createdAt: new Date(), modifiedAt: new Date() });
}

describe('release', () => {
  let container: ReturnType<typeof mockDeep<Container>>;
  const finder = mockDeep<TemporalFileByPathFinder>();
  const uploader = mockDeep<TemporalFileUploader>();
  const deleter = mockDeep<TemporalFileDeleter>();
  const fileSearcher = mockDeep<FirstsFileSearcher>();

  beforeEach(() => {
    container = mockDeep<Container>();
    container.get.calledWith(TemporalFileByPathFinder).mockReturnValue(finder);
    container.get.calledWith(TemporalFileUploader).mockReturnValue(uploader);
    container.get.calledWith(TemporalFileDeleter).mockReturnValue(deleter);
    container.get.calledWith(FirstsFileSearcher).mockReturnValue(fileSearcher);
    fileSearcher.run.mockResolvedValue(undefined);
  });

  describe('when no temporal file is found', () => {
    it('should return success without uploading', async () => {
      finder.run.mockResolvedValue(undefined);

      const { data, error } = await release({ path: '/Documents/file.pdf', processName: 'cat', container });

      expect(error).toBeUndefined();
      expect(data).toBeUndefined();
      calls(uploader.run).toHaveLength(0);
    });
  });

  describe('when an auxiliary file is found', () => {
    it('should return success, skip upload and delete it', async () => {
      finder.run.mockResolvedValue(createAuxiliaryFile('/Documents/.~lock.file.odt#'));

      const { data, error } = await release({ path: '/Documents/.~lock.file.odt#', processName: 'cat', container });

      expect(error).toBeUndefined();
      expect(data).toBeUndefined();
      calls(uploader.run).toHaveLength(0);
      call(deleter.run).toStrictEqual('/Documents/.~lock.file.odt#');
    });
  });

  describe('when a temporal file is found', () => {
    it('should upload without replaces when no virtual file exists', async () => {
      const temporalFile = createTemporalFile('/Documents/report.pdf');
      finder.run.mockResolvedValue(temporalFile);
      fileSearcher.run.mockResolvedValue(undefined);
      uploader.run.mockResolvedValue('contents-id-123' as ContentsId);

      const { data, error } = await release({ path: '/Documents/report.pdf', processName: 'cat', container });

      expect(error).toBeUndefined();
      expect(data).toBeUndefined();
      call(uploader.run).toStrictEqual([temporalFile, undefined]);
    });

    it('should upload with replaces when a virtual file exists at the same path', async () => {
      const temporalFile = createTemporalFile('/Documents/report.pdf');
      const existingFile = File.from(fileAttrs);
      finder.run.mockResolvedValue(temporalFile);
      fileSearcher.run.mockResolvedValue(existingFile);
      uploader.run.mockResolvedValue('new-contents-id' as ContentsId);

      const { data, error } = await release({ path: '/Documents/report.pdf', processName: 'cat', container });

      expect(error).toBeUndefined();
      expect(data).toBeUndefined();
      call(uploader.run).toStrictEqual([
        temporalFile,
        { contentsId: existingFile.contentsId, name: existingFile.name, extension: existingFile.type },
      ]);
    });

    it('should delete the file and return EIO when upload fails', async () => {
      finder.run.mockResolvedValue(createTemporalFile('/Documents/report.pdf'));
      uploader.run.mockRejectedValue(new Error('Network error'));

      const { data, error } = await release({ path: '/Documents/report.pdf', processName: 'cat', container });

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.EIO);
      call(deleter.run).toStrictEqual('/Documents/report.pdf');
    });

    it('should skip the second release when an upload for the same path is already in progress', async () => {
      const temporalFile = createTemporalFile('/Documents/report.pdf');
      finder.run.mockResolvedValue(temporalFile);
      fileSearcher.run.mockResolvedValue(undefined);

      // First release never resolves during the test — simulates a long in-progress upload
      let resolveFirstUpload!: () => void;
      uploader.run.mockReturnValue(
        new Promise<ContentsId>((resolve) => {
          resolveFirstUpload = () => resolve('contents-id-123' as ContentsId);
        }),
      );

      const first = release({ path: '/Documents/report.pdf', processName: 'proc-a', container });

      await Promise.resolve();

      const { data: data2, error: error2 } = await release({
        path: '/Documents/report.pdf',
        processName: 'proc-b',
        container,
      });

      expect(error2).toBeUndefined();
      expect(data2).toBeUndefined();
      calls(uploader.run).toHaveLength(1);

      resolveFirstUpload();
      await first;
    });
  });

  describe('when finder throws an unexpected error', () => {
    it('should return EIO without uploading or deleting', async () => {
      finder.run.mockRejectedValue(new Error('DB error'));

      const { data, error } = await release({ path: '/Documents/report.pdf', processName: 'cat', container });

      expect(data).toBeUndefined();
      expect(error?.code).toBe(FuseCodes.EIO);
      calls(uploader.run).toHaveLength(0);
      calls(deleter.run).toHaveLength(0);
    });
  });
});
