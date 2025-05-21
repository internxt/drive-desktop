import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FolderPlaceholderUpdater } from './UpdatePlaceholderFolder';
import { InMemoryFolderRepository } from '../../infrastructure/InMemoryFolderRepository';
import { NodeWinLocalFolderSystem } from '../../infrastructure/NodeWinLocalFolderSystem';
import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { FolderStatuses } from '../../domain/FolderStatus';
import { mockDeep } from 'vitest-mock-extended';
import { FolderMother } from 'tests/context/virtual-drive/folders/domain/FolderMother';
import { v4 } from 'uuid';
import VirtualDrive from '@/node-win/virtual-drive';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';

vi.mock(import('fs'));
vi.mock(import('@/context/virtual-drive/items/validate-windows-name'));

const mockRepository = mockDeep<InMemoryFolderRepository>();
const mockLocalFolderSystem = mockDeep<NodeWinLocalFolderSystem>();
const mockPathConverter = mockDeep<RelativePathToAbsoluteConverter>();
const virtualDrive = mockDeep<VirtualDrive>();
const validateWindowsNameMock = deepMocked(validateWindowsName);

describe('FolderPlaceholderUpdater', () => {
  const updater = new FolderPlaceholderUpdater(mockRepository, mockLocalFolderSystem, mockPathConverter, virtualDrive);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasToBeDeleted', () => {
    it('should return true if local exists and remote is trashed or deleted', () => {
      const local = FolderMother.fromPartial({
        status: FolderStatuses.EXISTS,
      });
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.TRASHED,
      });

      const result = updater['hasToBeDeleted'](local, remote);

      expect(result).toBe(true);
    });

    it('should return false if local does not exist', () => {
      const local = FolderMother.fromPartial({
        status: FolderStatuses.TRASHED,
      });
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.TRASHED,
      });

      const result = updater['hasToBeDeleted'](local, remote);

      expect(result).toBe(false);
    });
  });

  describe('hasToBeCreated', () => {
    it('should return true if remote exists and folder does not exist locally', async () => {
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.EXISTS,
        path: '/remotePath',
      });

      mockPathConverter.run.mockReturnValue('convertedPath');
      virtualDrive.getPlaceholderState.mockReturnValue({
        syncState: SyncState.InSync,
        pinState: PinState.Unspecified,
      });

      updater['folderExists'] = vi.fn().mockResolvedValue(false);

      const result = await updater['hasToBeCreated'](remote);

      expect(result).toBe(true);
      expect(mockPathConverter.run).toHaveBeenCalledWith('/remotePath');
    });

    it('should return true if remote exists and folder is not synced', async () => {
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.EXISTS,
        path: '/remotePath',
      });

      mockPathConverter.run.mockReturnValue('convertedPath');
      virtualDrive.getPlaceholderState.mockReturnValue({
        syncState: SyncState.NotInSync,
        pinState: PinState.Unspecified,
      });

      updater['folderExists'] = vi.fn().mockResolvedValue(true);

      const result = await updater['hasToBeCreated'](remote);

      expect(result).toBe(true);
      expect(mockPathConverter.run).toHaveBeenCalledWith('/remotePath');
    });

    it('should return false if folder exists locally and is synced', async () => {
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.EXISTS,
        path: '/remotePath',
      });

      mockPathConverter.run.mockReturnValue('convertedPath');
      virtualDrive.getPlaceholderState.mockReturnValue({
        syncState: SyncState.InSync,
        pinState: PinState.Unspecified,
      });

      updater['folderExists'] = vi.fn().mockResolvedValue(true);

      const result = await updater['hasToBeCreated'](remote);

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should not do anything if is root folder', async () => {
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.EXISTS,
        path: '/',
        uuid: v4(),
      });

      await updater.update(remote);

      expect(validateWindowsNameMock).not.toHaveBeenCalled();
      expect(mockRepository.searchByPartial).not.toHaveBeenCalled();
    });

    it('should not do anything if name is not valid', async () => {
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.EXISTS,
        path: '/',
        uuid: v4(),
      });

      validateWindowsNameMock.mockReturnValue({ isValid: false });

      await updater.update(remote);

      expect(mockRepository.searchByPartial).not.toHaveBeenCalled();
    });

    it('should create a folder placeholder if it does not exist locally', async () => {
      const remote = FolderMother.fromPartial({
        status: FolderStatuses.EXISTS,
        path: '/remotePath',
        uuid: v4(),
      });

      mockRepository.searchByPartial.mockReturnValue(undefined);
      mockPathConverter.run.mockReturnValue('/convertedPath');
      validateWindowsNameMock.mockReturnValue({ isValid: true });

      await updater.update(remote);

      expect(mockRepository.add).toHaveBeenCalledWith(remote);
      expect(mockLocalFolderSystem.createPlaceHolder).toHaveBeenCalledWith(remote);
    });

    // it('should delete a folder if it has to be deleted', async () => {
    //   const local = { status: FolderStatuses.EXISTS, path: '/localPath', uuid: '123' } as Folder;
    //   const remote = { status: FolderStatuses.TRASHED, path: '/remotePath', uuid: '123' } as Folder;

    //   mockRepository.searchByPartial.mockReturnValue(local);
    //   mockPathConverter.run.mockReturnValue('/convertedPath');

    //   await updater.update(remote);

    //   expect(fs.rm).toHaveBeenCalledWith('/convertedPath', { recursive: true });
    // });

    // it.only('should rename a folder if its name or parentId changes', async () => {
    //   const local = FolderMother.fromPartial({
    //     status: FolderStatuses.EXISTS,
    //     path: '/localPath',
    //     uuid: v4(),
    //     parentId: 1,
    //   });
    //   const remote = FolderMother.fromPartial({
    //     status: FolderStatuses.EXISTS,
    //     path: '/remotePath',
    //     uuid: local.uuid,
    //     parentId: 2,
    //   });

    //   mockRepository.searchByPartial.mockReturnValue(local);

    //   mockPathConverter.run.mockImplementation((path) => path);
    //   updater['folderExists'] = vi.fn().mockResolvedValue(true);
    //   updater['canWrite'] = vi.fn().mockResolvedValue(true);

    //   await updater.update(remote);

    //   expect(fs.rename).toHaveBeenCalledWith('/localPath', '/remotePath');
    //   expect(mockRepository.update).toHaveBeenCalledWith(remote);
    // });
  });

  describe('run', () => {
    it('should process multiple folders', async () => {
      const remotes = [
        FolderMother.fromPartial({ path: '/remote1', status: FolderStatuses.EXISTS, uuid: v4() }),
        FolderMother.fromPartial({ path: '/remote2', status: FolderStatuses.TRASHED, uuid: v4() }),
      ];

      updater['update'] = vi.fn();

      await updater.run(remotes);

      expect(updater['update']).toHaveBeenCalledTimes(2);
    });
  });
});
