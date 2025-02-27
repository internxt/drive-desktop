import {
  RemoteSyncError,
  RemoteSyncInvalidResponseError,
  RemoteSyncNetworkError,
  RemoteSyncServerError,
} from '../errors';
import Logger from 'electron-log';
import { addVirtualDriveIssue } from '../../issues/virtual-drive';
import { VirtualDriveIssue } from '../../../../shared/issues/VirtualDriveIssue';
import { reportError } from '../../bug-report/service';

export type syncItemType = 'files' | 'folders';

export interface VirtualDriveIssueByType {
  files: VirtualDriveIssue;
  folders: VirtualDriveIssue;
}

export class RemoteSyncErrorHandler {
  public handleSyncError(
    error: RemoteSyncError,
    syncItemType: syncItemType,
    itemName: string,
    itemCheckpoint?: Date
  ): void {
    switch (true) {
      case error instanceof RemoteSyncNetworkError:
        this.handleNetworkError(error, syncItemType, itemName);
        break;
      case error instanceof RemoteSyncServerError:
        this.handleServerError(error, syncItemType, itemName);
        break;
      case error instanceof RemoteSyncInvalidResponseError:
        // no-op
        break;
      default:
        this.handleRemoteSyncError(error, syncItemType, itemName);
    }
    this.reportErrorToSentry(error, syncItemType, itemCheckpoint);
  }

  handleSyncErrorWithIssue(
    error: RemoteSyncError,
    syncItemType: syncItemType,
    errorDetail: {
      errorLabel: string;
      issue: VirtualDriveIssue;
    }
  ): void {
    Logger.error(
      `[SYNC MANAGER] Remote ${syncItemType} sync failed with ${errorDetail.errorLabel} error: `,
      error
    );
    addVirtualDriveIssue(errorDetail.issue);
  }

  handleNetworkError(
    error: RemoteSyncNetworkError,
    syncItemType: syncItemType,
    itemName: string
  ): void {
    const issues: VirtualDriveIssueByType = {
      files: {
        error: 'DOWNLOAD_ERROR',
        cause: 'NO_INTERNET',
        name: itemName,
      },
      folders: {
        error: 'FOLDER_CREATE_ERROR',
        cause: 'NO_INTERNET',
        name: itemName,
      },
    };
    this.handleSyncErrorWithIssue(error, syncItemType, {
      errorLabel: 'network',
      issue: issues[syncItemType],
    });
  }

  handleServerError(
    error: RemoteSyncServerError,
    syncItemType: syncItemType,
    itemName: string
  ): void {
    const issues: VirtualDriveIssueByType = {
      files: {
        error: 'DOWNLOAD_ERROR',
        cause: 'NO_REMOTE_CONNECTION',
        name: itemName,
      },
      folders: {
        error: 'FOLDER_CREATE_ERROR',
        cause: 'NO_REMOTE_CONNECTION',
        name: itemName,
      },
    };
    this.handleSyncErrorWithIssue(error, syncItemType, {
      errorLabel: 'server',
      issue: issues[syncItemType],
    });
  }

  handleRemoteSyncError(
    error: RemoteSyncError,
    syncItemType: syncItemType,
    itemName: string
  ): void {
    const issues: VirtualDriveIssueByType = {
      files: {
        error: 'DOWNLOAD_ERROR',
        cause: 'NO_REMOTE_CONNECTION',
        name: itemName,
      },
      folders: {
        error: 'FOLDER_CREATE_ERROR',
        cause: 'NO_REMOTE_CONNECTION',
        name: itemName,
      },
    };

    this.handleSyncErrorWithIssue(error, syncItemType, {
      errorLabel: 'remote',
      issue: issues[syncItemType],
    });
  }

  reportErrorToSentry(
    error: RemoteSyncError,
    syncItemType: syncItemType,
    itemCheckpoint?: Date
  ): void {
    switch (syncItemType) {
      case 'files':
        reportError(error, {
          lastFilesSyncAt:
            itemCheckpoint?.toISOString() ?? 'INITIAL_FILES_SYNC',
        });
        break;
      case 'folders':
        reportError(error, {
          lastFoldersSyncAt:
            itemCheckpoint?.toISOString() ?? 'INITIAL_FOLDERS_SYNC',
        });
        break;
    }
  }
}
