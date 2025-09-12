import { RemoteSyncErrorHandler, syncItemType } from './RemoteSyncErrorHandler';
import {
  RemoteSyncError,
  RemoteSyncNetworkError,
  RemoteSyncServerError,
} from '../errors';
import { addVirtualDriveIssue } from '../../issues/virtual-drive';
import { reportError } from '../../bug-report/service';
import { VirtualDriveIssue } from '../../../../shared/issues/VirtualDriveIssue';

jest.mock('@internxt/drive-desktop-core/build/backend');

jest.mock('../../issues/virtual-drive', () => ({
  addVirtualDriveIssue: jest.fn(),
}));

jest.mock('../../bug-report/service', () => ({
  reportError: jest.fn(),
}));

describe('RemoteSyncErrorHandler', () => {
  let sut: RemoteSyncErrorHandler;

  beforeEach(() => {
    sut = new RemoteSyncErrorHandler();
    jest.clearAllMocks();
  });

  describe('handleSyncError ', () => {
    it('should handle properly a type RemoteSyncNetworkError', () => {
      const networkError = new RemoteSyncNetworkError('Test error');
      const syncType: syncItemType = 'files';
      const itemName = 'Test File';
      const checkpoint = new Date('2025-02-24');
      const handleNetworkErrorSpy = jest.spyOn(sut, 'handleNetworkError');
      const reportErrorToSentrySpy = jest.spyOn(sut, 'reportErrorToSentry');

      sut.handleSyncError(networkError, syncType, itemName, checkpoint);

      expect(handleNetworkErrorSpy).toHaveBeenCalledWith(
        networkError,
        syncType,
        itemName
      );
      expect(reportErrorToSentrySpy).toHaveBeenCalledWith(
        networkError,
        syncType,
        checkpoint
      );
      expect(addVirtualDriveIssue).toHaveBeenCalled();
    });

    it('should handle properly a type RemoteSyncServerError', () => {
      const serverError = new RemoteSyncServerError(500, {
        message: 'Server error occurred',
      });
      const syncType: syncItemType = 'folders';
      const itemName = 'Test Folder';
      const checkpoint = new Date('2025-02-24');
      const handleServerErrorSpy = jest.spyOn(sut, 'handleServerError');
      const reportErrorToSentrySpy = jest.spyOn(sut, 'reportErrorToSentry');

      sut.handleSyncError(serverError, syncType, itemName, checkpoint);

      expect(handleServerErrorSpy).toHaveBeenCalledWith(
        serverError,
        syncType,
        itemName
      );
      expect(reportErrorToSentrySpy).toHaveBeenCalledWith(
        serverError,
        syncType,
        checkpoint
      );
      expect(addVirtualDriveIssue).toHaveBeenCalled();
    });

    it('should handle properly the default type RemoteSyncError', () => {
      const genericError = new RemoteSyncError('Test generic error');
      const syncType: syncItemType = 'files';
      const itemName = 'Test File';
      const checkpoint = new Date('2025-02-24');
      const handleRemoteSyncErrorSpy = jest.spyOn(sut, 'handleRemoteSyncError');
      const reportErrorToSentrySpy = jest.spyOn(sut, 'reportErrorToSentry');

      sut.handleSyncError(genericError, syncType, itemName, checkpoint);

      expect(handleRemoteSyncErrorSpy).toHaveBeenCalledWith(
        genericError,
        syncType,
        itemName
      );
      expect(reportErrorToSentrySpy).toHaveBeenCalledWith(
        genericError,
        syncType,
        checkpoint
      );
      expect(addVirtualDriveIssue).toHaveBeenCalled();
    });

    it('should properly report error to sentry', () => {
      const genericError = new RemoteSyncError('Test generic error');
      const syncType: syncItemType = 'files';
      const itemName = 'Test File';
      const checkpoint = new Date('2025-02-24');
      const reportErrorToSentrySpy = jest.spyOn(sut, 'reportErrorToSentry');

      sut.handleSyncError(genericError, syncType, itemName, checkpoint);

      expect(reportErrorToSentrySpy).toHaveBeenCalledWith(
        genericError,
        syncType,
        checkpoint
      );
    });
  });

  describe('handleSyncErrorWithIssue', () => {
    it('should properly add a virtual drive issue', () => {
      const genericError = new RemoteSyncError('Test generic error');
      const syncType: syncItemType = 'files';
      const errorDetail = {
        errorLabel: 'Test error label',
        issue: {
          error: 'UPLOAD_ERROR',
          cause: 'NO_INTERNET',
          name: 'Test File',
        } as VirtualDriveIssue,
      };

      const issues: Record<syncItemType, VirtualDriveIssue> = {
        files: {
          error: 'UPLOAD_ERROR',
          cause: 'NO_INTERNET',
          name: 'Test File',
        },
        folders: {
          error: 'UPLOAD_ERROR',
          cause: 'NO_INTERNET',
          name: 'Test Folder',
        },
      };

      sut.handleSyncErrorWithIssue(genericError, syncType, errorDetail);

      expect(addVirtualDriveIssue).toHaveBeenCalledWith(issues[syncType]);
    });
  });

  describe('reportErrorToSentry', () => {
    it('should call reportError with a valid "lastFilesSyncAt" properly', () => {
      const error = new RemoteSyncError('Test error');
      const syncType: syncItemType = 'files';
      const checkpoint = new Date('2025-02-24');

      sut.reportErrorToSentry(error, syncType, checkpoint);

      expect(reportError).toHaveBeenCalledWith(error, {
        lastFilesSyncAt: checkpoint.toISOString(),
      });
    });

    it('should call reportError with "INITIAL_FILES_SYNC" when syncItemType is "files" and no checkpoint is provided', () => {
      const error = new RemoteSyncError('Test error');
      const syncType: syncItemType = 'files';

      sut.reportErrorToSentry(error, syncType);

      expect(reportError).toHaveBeenCalledWith(error, {
        lastFilesSyncAt: 'INITIAL_FILES_SYNC',
      });
    });

    it('should call reportError with "INITIAL_FOLDERS_SYNC" when syncItemType is "folders" and no checkpoint is provided', () => {
      const error = new RemoteSyncError('Test error');
      const syncType: syncItemType = 'folders';

      sut.reportErrorToSentry(error, syncType);

      expect(reportError).toHaveBeenCalledWith(error, {
        lastFoldersSyncAt: 'INITIAL_FOLDERS_SYNC',
      });
    });
  });
});
