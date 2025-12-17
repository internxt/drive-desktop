vi.mock('@internxt/drive-desktop-core/build/backend');

vi.mock('../../issues/virtual-drive', () => ({
  addVirtualDriveIssue: vi.fn(),
}));

import { RemoteSyncErrorHandler, syncItemType } from './RemoteSyncErrorHandler';
import { RemoteSyncError, RemoteSyncNetworkError, RemoteSyncServerError } from '../errors';
import { addVirtualDriveIssue } from '../../issues/virtual-drive';
import { VirtualDriveIssue } from '../../../../shared/issues/VirtualDriveIssue';

describe('RemoteSyncErrorHandler', () => {
  let sut: RemoteSyncErrorHandler;

  beforeEach(() => {
    sut = new RemoteSyncErrorHandler();
    vi.clearAllMocks();
  });

  describe('handleSyncError ', () => {
    it('should handle properly a type RemoteSyncNetworkError', () => {
      const networkError = new RemoteSyncNetworkError('Test error');
      const syncType: syncItemType = 'files';
      const itemName = 'Test File';
      const checkpoint = new Date('2025-02-24');
      const handleNetworkErrorSpy = vi.spyOn(sut, 'handleNetworkError');

      sut.handleSyncError(networkError, syncType, itemName, checkpoint);

      expect(handleNetworkErrorSpy).toHaveBeenCalledWith(networkError, syncType, itemName);
      expect(addVirtualDriveIssue).toHaveBeenCalled();
    });

    it('should handle properly a type RemoteSyncServerError', () => {
      const serverError = new RemoteSyncServerError(500, {
        message: 'Server error occurred',
      });
      const syncType: syncItemType = 'folders';
      const itemName = 'Test Folder';
      const checkpoint = new Date('2025-02-24');
      const handleServerErrorSpy = vi.spyOn(sut, 'handleServerError');

      sut.handleSyncError(serverError, syncType, itemName, checkpoint);

      expect(handleServerErrorSpy).toHaveBeenCalledWith(serverError, syncType, itemName);
      expect(addVirtualDriveIssue).toHaveBeenCalled();
    });

    it('should handle properly the default type RemoteSyncError', () => {
      const genericError = new RemoteSyncError('Test generic error');
      const syncType: syncItemType = 'files';
      const itemName = 'Test File';
      const checkpoint = new Date('2025-02-24');
      const handleRemoteSyncErrorSpy = vi.spyOn(sut, 'handleRemoteSyncError');

      sut.handleSyncError(genericError, syncType, itemName, checkpoint);

      expect(handleRemoteSyncErrorSpy).toHaveBeenCalledWith(genericError, syncType, itemName);
      expect(addVirtualDriveIssue).toHaveBeenCalled();
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
});
