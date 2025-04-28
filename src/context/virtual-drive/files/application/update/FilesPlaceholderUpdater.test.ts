import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilesPlaceholderUpdater } from './FilesPlaceholderUpdater';
import { InMemoryFileRepository } from '../../infrastructure/InMemoryFileRepository';
import { NodeWinLocalFileSystem } from '../../infrastructure/NodeWinLocalFileSystem';
import { RelativePathToAbsoluteConverter } from '../../../shared/application/RelativePathToAbsoluteConverter';
import { LocalFileIdProvider } from '../../../shared/application/LocalFileIdProvider';
import { mockDeep } from 'vitest-mock-extended';
import { FileMother } from 'tests/context/virtual-drive/files/domain/FileMother';
import { FileStatuses } from '../../domain/FileStatus';
import { v4 } from 'uuid';
import fs from 'fs/promises';
import { InMemoryEventRepository } from '@/context/virtual-drive/shared/infrastructure/InMemoryEventHistory';

vi.mock(import('fs/promises'));

const mockRepository = mockDeep<InMemoryFileRepository>();

const mockLocalFileSystem = mockDeep<NodeWinLocalFileSystem>();

const mockPathConverter = mockDeep<RelativePathToAbsoluteConverter>();

const mockFileIdProvider = mockDeep<LocalFileIdProvider>();

const mockEventHistory = mockDeep<InMemoryEventRepository>();

describe('FilesPlaceholderUpdater', () => {
  let updater: FilesPlaceholderUpdater;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    updater = new FilesPlaceholderUpdater(mockRepository, mockLocalFileSystem, mockPathConverter, mockFileIdProvider, mockEventHistory);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('hasToBeDeleted', () => {
    it('should return true if local exists and remote is trashed or deleted', () => {
      const local = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
      });

      const remote = FileMother.fromPartial({
        status: FileStatuses.TRASHED,
      });

      const result = updater['hasToBeDeleted'](local, remote);

      expect(result).toBe(true);
    });

    it('should return false if local does not exist', () => {
      const local = FileMother.fromPartial({
        status: FileStatuses.TRASHED,
      });
      const remote = FileMother.fromPartial({
        status: FileStatuses.TRASHED,
      });

      const result = updater['hasToBeDeleted'](local, remote);

      expect(result).toBe(false);
    });
  });

  describe('hasToBeUpdatedIdentity', () => {
    it('should return true if identities are different', () => {
      const local = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
        path: '/localPath/file.txt',
        uuid: v4(),
      });
      const remote = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
        uuid: v4(),
      });

      mockLocalFileSystem.getFileIdentity.mockResolvedValue('localId');

      const result = updater['hasToBeUpdatedIdentity'](local, remote);

      expect(result).toBe(true);
      expect(mockLocalFileSystem.getFileIdentity).toHaveBeenCalledWith('/localPath/file.txt');
    });

    it('should return false if identities are the same', () => {
      const sameUuid = v4();

      const local = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
        path: '/localPath/file.txt',
        uuid: sameUuid,
      });
      const remote = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
        uuid: sameUuid,
      });

      mockLocalFileSystem.getFileIdentity.mockResolvedValue('FILE:' + sameUuid);

      const result = updater['hasToBeUpdatedIdentity'](local, remote);

      expect(result).toBe(false);
    });

    it('should return false if local does not exist', () => {
      const local = FileMother.fromPartial({
        status: FileStatuses.TRASHED,
      });
      const remote = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
      });

      const result = updater['hasToBeUpdatedIdentity'](local, remote);

      expect(result).toBe(false);
    });
    it('should return false if remote does not exist', () => {
      const local = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
      });
      const remote = FileMother.fromPartial({
        status: FileStatuses.TRASHED,
      });

      const result = updater['hasToBeUpdatedIdentity'](local, remote);

      expect(result).toBe(false);
    });
  });

  describe('hasToBeCreated', () => {
    it('should return true if remote exists and file does not exist locally', async () => {
      const remote = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
        path: '/remotePath',
      });

      mockPathConverter.run.mockReturnValue('convertedPath');

      updater['fileExists'] = vi.fn().mockResolvedValue(false);

      const result = await updater['hasToBeCreated'](remote);

      expect(result).toBe(true);
      expect(mockPathConverter.run).toHaveBeenCalledWith('/remotePath');
    });

    it('should return false if file exists locally', async () => {
      const remote = FileMother.fromPartial({
        status: FileStatuses.EXISTS,
        path: '/remotePath',
      });

      mockPathConverter.run.mockReturnValue('convertedPath');

      updater['fileExists'] = vi.fn().mockResolvedValue(true);

      const result = await updater['hasToBeCreated'](remote);

      expect(result).toBe(false);
    });
  });

  describe('run', () => {
    it('should create one file, update identity for another, and delete a third', async () => {
      const remotes = [
        FileMother.fromPartial({ path: '/remote1', status: FileStatuses.EXISTS }),
        FileMother.fromPartial({ path: '/remote2', status: FileStatuses.EXISTS }),
        FileMother.fromPartial({ path: '/remote3', status: FileStatuses.TRASHED }),
      ];

      const oldIdentity = v4();
      const newIdentity = v4();

      const locals = [
        FileMother.fromPartial({
          path: '/remote2',
          status: FileStatuses.EXISTS,
          contentsId: remotes[1].contentsId,
          uuid: newIdentity,
        }),
        FileMother.fromPartial({
          path: '/remote3',
          status: FileStatuses.EXISTS,
          contentsId: remotes[2].contentsId,
          uuid: oldIdentity,
        }),
      ];

      mockRepository.searchByPartial.mockImplementation(({ contentsId }) => locals.find((file) => file.contentsId === contentsId));

      mockPathConverter.run.mockReturnValue('/remote3');

      mockLocalFileSystem.getFileIdentity.mockResolvedValue(oldIdentity);
      updater['fileExists'] = vi.fn().mockImplementation((path) => path === '/remote2');

      await updater.run(remotes);

      expect(mockLocalFileSystem.createPlaceHolder).toHaveBeenCalledWith(remotes[0]);
      expect(mockLocalFileSystem.updateFileIdentity).toHaveBeenCalledWith('/remote2', 'FILE:' + newIdentity);
      expect(fs.rm).toHaveBeenCalledWith('/remote3');
    });

    it('should only create files when none exist locally', async () => {
      const remotes = [
        FileMother.fromPartial({ path: '/remote1', status: FileStatuses.EXISTS }),
        FileMother.fromPartial({ path: '/remote2', status: FileStatuses.EXISTS }),
        FileMother.fromPartial({ path: '/remote3', status: FileStatuses.EXISTS }),
      ];

      updater['fileExists'] = vi.fn().mockResolvedValue(false);

      await updater.run(remotes);

      expect(mockLocalFileSystem.createPlaceHolder).toHaveBeenCalledTimes(3);
      expect(mockLocalFileSystem.createPlaceHolder).toHaveBeenCalledWith(remotes[0]);
      expect(mockLocalFileSystem.createPlaceHolder).toHaveBeenCalledWith(remotes[1]);
      expect(mockLocalFileSystem.createPlaceHolder).toHaveBeenCalledWith(remotes[2]);
    });

    it('should only update file identities when identities differ', async () => {
      const newsUuids = [v4(), v4()];
      const oldsUuids = [v4()];
      const remotes = [
        FileMother.fromPartial({ path: '/remote1', status: FileStatuses.EXISTS, uuid: newsUuids[0] }),
        FileMother.fromPartial({ path: '/remote2', status: FileStatuses.EXISTS, uuid: newsUuids[1] }),
      ];

      const localFiles = [
        FileMother.fromPartial({ path: '/remote1', status: FileStatuses.EXISTS, uuid: newsUuids[0], contentsId: remotes[0].contentsId }),
        FileMother.fromPartial({ path: '/remote2', status: FileStatuses.EXISTS, uuid: newsUuids[1], contentsId: remotes[1].contentsId }),
      ];

      mockRepository.searchByPartial.mockImplementation(({ contentsId }) => localFiles.find((file) => file.contentsId === contentsId));

      mockLocalFileSystem.getFileIdentity.mockImplementation((path) =>
        path === '/remote1' ? `FILE:${oldsUuids[0]}` : `FILE:${newsUuids[1]}`,
      );

      await updater.run(remotes);

      expect(mockLocalFileSystem.updateFileIdentity).toHaveBeenCalledTimes(1);
      expect(mockLocalFileSystem.updateFileIdentity).toHaveBeenCalledWith('/remote1', `FILE:${newsUuids[0]}`);
    });

    it('should only delete files when remote status is trashed or deleted', async () => {
      const remotes = [
        FileMother.fromPartial({ path: '/remote1', status: FileStatuses.TRASHED }),
        FileMother.fromPartial({ path: '/remote2', status: FileStatuses.DELETED }),
      ];

      const localFiles = [
        FileMother.fromPartial({ path: '/remote1', status: FileStatuses.EXISTS, contentsId: remotes[0].contentsId }),
        FileMother.fromPartial({ path: '/remote2', status: FileStatuses.EXISTS, contentsId: remotes[1].contentsId }),
      ];

      mockRepository.searchByPartial.mockImplementation(({ contentsId }) => localFiles.find((file) => file.contentsId === contentsId));
      mockPathConverter.run.mockImplementation((path) => path);

      await updater.run(remotes);

      expect(fs.rm).toHaveBeenCalledTimes(2);
      expect(fs.rm).toHaveBeenCalledWith('/remote1');
      expect(fs.rm).toHaveBeenCalledWith('/remote2');
    });
  });
});
