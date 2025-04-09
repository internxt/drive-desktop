import * as Sentry from '@sentry/electron/renderer';
import { mockDeep } from 'vitest-mock-extended';
import { FetchDataService } from './fetchData.service';
import { BindingsManager } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { SyncEngineIpc } from '../ipcRendererSyncEngine';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { DeepPartial } from 'ts-essentials';
import fs from 'fs';

vi.mock('fs');
vi.mock('@sentry/electron/renderer', () => {
  return {
    captureException: vi.fn(),
  };
});

const fetchData = new FetchDataService();

describe('Fetch Data', () => {
  const self = mockDeep<BindingsManager>();
  const ipcRendererSyncEngine = mockDeep<SyncEngineIpc>();
  const file: DeepPartial<File> = { path: 'path' };
  const filePlaceholderId: FilePlaceholderId = 'FILE:1';

  beforeEach(() => {
    vi.clearAllMocks();

    self.controllers.downloadFile.execute.mockResolvedValue('path');
    self.controllers.downloadFile.fileFinderByUuid.mockReturnValue(file as File);
  });

  describe('When call normalizePath', () => {
    it('When using slash, then return the parent path', () => {
      // Act
      const result = fetchData.normalizePath('C:/windows/system32');

      // Arrange
      expect(result).toBe('C:/windows');
    });

    it('When using backslash, then parse and return the parent path', () => {
      // Act
      const result = fetchData.normalizePath('C:\\windows\\system32');

      // Arrange
      expect(result).toBe('C:/windows');
    });
  });

  describe('When progress value is wrong', () => {
    it('When progress is greater than 1, then throw an error', async () => {
      // Arrange
      const callback = async () => ({ finished: false, progress: 2 });

      // Act
      await fetchData.run({ self, filePlaceholderId, callback, ipcRendererSyncEngine });

      // Arrange
      expect(fs.unlinkSync).toHaveBeenCalledWith('path');
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('When progress is less than 0, then throw an error', async () => {
      // Arrange
      const callback = async () => ({ finished: false, progress: -1 });

      // Act
      await fetchData.run({ self, filePlaceholderId, callback, ipcRendererSyncEngine });

      // Arrange
      expect(fs.unlinkSync).toHaveBeenCalledWith('path');
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('When finished but progress is 0, then throw an error', async () => {
      // Arrange
      const callback = async () => ({ finished: true, progress: 0 });

      // Act
      await fetchData.run({ self, filePlaceholderId, callback, ipcRendererSyncEngine });

      // Arrange
      expect(fs.unlinkSync).toHaveBeenCalledWith('path');
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });
  });
});
