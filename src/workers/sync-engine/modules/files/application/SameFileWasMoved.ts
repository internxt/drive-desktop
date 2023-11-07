import { LocalFileIdProvider } from '../../shared/application/LocalFileIdProvider';
import { EventRepository } from '../../shared/domain/EventRepository';
import { FilePath } from '../domain/FilePath';
import { FileRepository } from '../domain/FileRepository';
import { FileMovedDomainEvent } from '../domain/events/FileMovedDomainEvent';
import Logger from 'electron-log';

// TODO: find a better name
type WasMovedResult = { result: false } | { result: true; contentsId: string };

export class SameFileWasMoved {
  constructor(
    private readonly repository: FileRepository,
    private readonly localFileIdProvider: LocalFileIdProvider,
    private readonly eventHistory: EventRepository
  ) {}

  async run(path: FilePath): Promise<WasMovedResult> {
    const fileInDestination = this.repository.searchByPartial({
      path: path,
    });

    if (!fileInDestination) {
      return { result: false };
    }

    const events = await this.eventHistory.search(fileInDestination.contentsId);

    if (events.length === 0) {
      return { result: false };
    }

    const movedEvent = events.find(
      (event) => event instanceof FileMovedDomainEvent
    );

    if (!movedEvent) {
      return { result: false };
    }

    const trackerId = await this.localFileIdProvider.run(path);

    if (trackerId !== movedEvent.toPrimitives().trackerId) {
      return { result: false };
    }

    Logger.warn('The file has been moved here');
    return { result: true, contentsId: fileInDestination.contentsId };
  }
}
