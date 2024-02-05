import { SyncEngineIpc } from '../../../../apps/sync-engine/SyncEngineIpc';
import { EventRepository } from '../../shared/domain/EventRepository';
import { ContentsDownloadedDomainEvent } from '../domain/events/ContentsDownloadedDomainEvent';
import Logger from 'electron-log';

export class NotifyMainProcessHydrationFinished {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(contentsId: string) {
    const events = await this.eventRepository.search(contentsId);

    const downloadCompletionEvent = events.find(
      (event) => event.eventName === 'contents.downloaded'
    );

    if (!downloadCompletionEvent) {
      Logger.debug('Download completion event not found');
      return;
    }

    const event = downloadCompletionEvent as ContentsDownloadedDomainEvent;

    this.ipc.send('FILE_DOWNLOADED', {
      name: event.name,
      extension: event.extension,
      nameWithExtension: event.nameWithExtension,
      size: event.size,
      processInfo: { elapsedTime: event.elapsedTime },
    });
  }
}
