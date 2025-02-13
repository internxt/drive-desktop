import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EventRepository } from '../../shared/domain/EventRepository';
import { ContentsDownloadedDomainEvent } from '../domain/events/ContentsDownloadedDomainEvent';
import Logger from 'electron-log';

export class NotifyMainProcessHydrationFinished {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ipc: SyncEngineIpc,
  ) {}

  async run(contentsId: string) {
    try {
      const events = await this.eventRepository.search(contentsId);

      const downloadCompletionEvent = events.find((event) => event.eventName === 'contents.downloaded');

      if (!downloadCompletionEvent) {
        Logger.debug(`Download completion event not found for content ID: ${contentsId}`);
        return;
      }

      const event = downloadCompletionEvent as ContentsDownloadedDomainEvent;

      // Verificar si la conexión sigue activa antes de enviar el mensaje
      if (this.ipc) {
        this.ipc.send('FILE_DOWNLOADED', {
          name: event.name,
          extension: event.extension,
          nameWithExtension: event.nameWithExtension,
          size: event.size,
          processInfo: { elapsedTime: event.elapsedTime },
        });
        Logger.info(`Notification sent for file: ${event.nameWithExtension}`);
      } else {
        Logger.warn('IPC connection is not active or process is not available');
      }
    } catch (error) {
      Logger.error('Error notifying main process about hydration completion', error);
    }
  }
}
