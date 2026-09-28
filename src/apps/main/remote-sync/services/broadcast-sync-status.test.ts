import * as issues from '@/apps/main/background-processes/issues';
import { SyncContext } from '@/apps/sync-engine/config';
import { call, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as tray from '../../tray/tray';
import * as windows from '../../windows';
import { RemoteSyncStatus } from '../helpers';
import { WorkerConfig, workers } from '../store';
import { broadcastSyncStatus } from './broadcast-sync-status';

describe('broadcast-sync-status', () => {
  const setTrayStatusMock = partialSpyOn(tray, 'setTrayStatus');
  const hasUploadIssuesMock = partialSpyOn(issues, 'hasUploadIssues');
  partialSpyOn(windows, 'broadcastToWidget');

  function setStatus(status: RemoteSyncStatus) {
    workers.set('workspace', { ctx: { status } as SyncContext } as WorkerConfig);
  }

  beforeEach(() => {
    workers.clear();
    hasUploadIssuesMock.mockReturnValue(false);
  });

  it('should show the tray as idle when everything is synced', () => {
    // Given
    setStatus('SYNCED');
    // When
    broadcastSyncStatus();
    // Then
    call(setTrayStatusMock).toBe('IDLE');
  });

  it('should show the tray as alert when everything is synced but some files were not uploaded', () => {
    // Given
    setStatus('SYNCED');
    hasUploadIssuesMock.mockReturnValue(true);
    // When
    broadcastSyncStatus();
    // Then
    call(setTrayStatusMock).toBe('ALERT');
  });

  it('should keep showing the tray as syncing while it syncs', () => {
    // Given
    setStatus('SYNCING');
    hasUploadIssuesMock.mockReturnValue(true);
    // When
    broadcastSyncStatus();
    // Then
    call(setTrayStatusMock).toBe('SYNCING');
  });
});
