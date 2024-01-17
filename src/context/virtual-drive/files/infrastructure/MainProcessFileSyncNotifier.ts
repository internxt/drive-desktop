import {
  trackError,
  trackEvent,
} from '../../../../apps/main/analytics/service';
import { addProcessIssue } from '../../../../apps/main/background-processes/process-issues';
import { setTrayStatus } from '../../../../apps/main/tray/tray';
import { broadcastToWindows } from '../../../../apps/main/windows';
import { ProcessIssue } from '../../../../apps/shared/types';
import { SyncMessenger } from '../../../shared/domain/SyncMessenger';
import { SyncFileMessenger } from '../domain/SyncFileMessenger';

export class MainProcessSyncFileMessenger
  extends SyncMessenger
  implements SyncFileMessenger
{
  async created(name: string, extension: string): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, extension);

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADED',
      name: nameWithExtension,
    });
  }

  async error(name: string, extension: string, message: string): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, extension);

    setTrayStatus('ALERT');

    trackError('Upload Error', new Error(message), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Upload',
    });

    broadcastToWindows('sync-info-update', {
      action: 'UPLOAD_ERROR',
      name: nameWithExtension,
    });
  }

  async trashing(_name: string, _type: string, _size: number): Promise<void> {
    setTrayStatus('SYNCING');
  }

  async trashed(name: string, type: string, size: number): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, type);

    trackEvent('Delete Completed', {
      file_name: name,
      file_extension: type,
      file_size: size,
    });

    broadcastToWindows('sync-info-update', {
      action: 'DELETED',
      name: nameWithExtension,
    });

    setTrayStatus('IDLE');
  }

  async errorWhileTrashing(
    name: string,
    type: string,
    message: string
  ): Promise<void> {
    const nameWithExtension = this.nameWithExtension(name, type);
    broadcastToWindows('sync-info-update', {
      action: 'DELETE_ERROR',
      name: nameWithExtension,
    });

    trackError('Delete Error', new Error(message), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Delete',
    });

    const issue: ProcessIssue = {
      kind: 'REMOTE',
      name,
      action: 'DELETE_ERROR',
      errorName: 'UNKNOWN',
      process: 'SYNC',
    };

    addProcessIssue(issue);
  }
}
