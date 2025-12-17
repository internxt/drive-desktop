vi.mock('@gcas/fuse', () => ({
  default: vi.fn(),
  Fuse: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    ops: {},
  })),
}));

vi.mock('../../main/remote-sync/service', () => ({
  getExistingFiles: vi.fn(),
}));

// Mock the electron-store
vi.mock('../../main/config', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

import { FuseApp } from './FuseApp';
import { FileRepositorySynchronizer } from '../../../context/virtual-drive/files/application/FileRepositorySynchronizer';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { VirtualDrive } from '../virtual-drive/VirtualDrive';
import configStore from '../../main/config';
import { getExistingFiles } from '../../main/remote-sync/service';
import { Mock } from 'vitest';

describe('FuseApp', () => {
  let fuseApp: FuseApp;
  let fileRepositoryMock: FileRepositorySynchronizer;
  const startDate = new Date('2025-02-19T12:00:00Z');
  const endDate = new Date('2025-03-04T15:30:00Z');

  beforeEach(() => {
    fileRepositoryMock = {
      fixDanglingFiles: vi.fn(),
    } as unknown as FileRepositorySynchronizer;

    const containerMock = {
      get: vi.fn((service) => {
        if (service === FileRepositorySynchronizer) {
          return fileRepositoryMock;
        }
        return null;
      }),
    } as unknown as Container;

    const virtualDriveMock = {} as unknown as VirtualDrive;

    fuseApp = new FuseApp(virtualDriveMock, containerMock, '/local/root', 123, 'ca4391b1-24d9-4e14-b305-e124b0ff5801');

    vi.spyOn(logger, 'debug').mockImplementation(vi.fn());
    vi.spyOn(logger, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fixDanglingFiles', () => {
    it('should not continue with the execution if configStore.shouldFixDanglingFiles returns false', async () => {
      (configStore.get as Mock).mockReturnValue(false);
      await fuseApp.fixDanglingFiles(startDate, endDate);

      expect(getExistingFiles).not.toHaveBeenCalled();
      expect(fileRepositoryMock.fixDanglingFiles).not.toHaveBeenCalled();
    });

    it('should fix only the files that are within a time period', async () => {
      (configStore.get as Mock).mockReturnValue(true);
      const mockFiles = [
        { fileId: 'file1', createdAt: '2025-02-20T10:00:00Z' }, // Within range
        { fileId: 'file2', createdAt: '2025-03-05T10:00:00Z' }, // Out of range
      ];

      (getExistingFiles as Mock).mockResolvedValue(mockFiles);
      (fileRepositoryMock.fixDanglingFiles as Mock).mockResolvedValue(true);

      await fuseApp.fixDanglingFiles(startDate, endDate);

      expect(fileRepositoryMock.fixDanglingFiles).toHaveBeenCalledWith(['file1']);
    });

    it('should not fix any files if there arent any', async () => {
      (configStore.get as Mock).mockReturnValue(true);
      const mockFiles = [
        { fileId: 'file1', createdAt: '2025-03-10T10:00:00Z' }, // Out of range
      ];
      (getExistingFiles as Mock).mockResolvedValue(mockFiles);

      await fuseApp.fixDanglingFiles(startDate, endDate);

      expect(fileRepositoryMock.fixDanglingFiles).not.toHaveBeenCalled();
    });

    it('should set the configStore.shouldFixDanglingFiles to false if all the files are fixed', async () => {
      (configStore.get as Mock).mockReturnValue(true);
      const mockFiles = [
        { fileId: 'file1', createdAt: '2025-02-20T10:00:00Z' }, // Within range
      ];
      (getExistingFiles as Mock).mockResolvedValue(mockFiles);
      (fileRepositoryMock.fixDanglingFiles as Mock).mockResolvedValue(true);

      await fuseApp.fixDanglingFiles(startDate, endDate);

      expect(configStore.set).toHaveBeenCalledWith('shouldFixDanglingFiles', false);
    });
  });
});
