import { Optional } from '../../../../shared/types/Optional';
import { ContentsAccededDomainEvent } from '../../contents/domain/events/ContentsAccededDomainEvent';
import { EventRepository } from '../../shared/domain/EventRepository';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';

export class FileToOverrideProvider {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly repository: FileRepository
  ) {}

  async run(): Promise<Optional<File>> {
    const eventOptional =
      await this.eventRepository.last<ContentsAccededDomainEvent>(
        ContentsAccededDomainEvent.EVENT_NAME
      );

    if (!eventOptional.isPresent()) {
      return Optional.empty();
    }

    const event = eventOptional.get();

    const file = this.repository
      .matchingPartial({
        contentsId: event.aggregateId,
        status: FileStatuses.EXISTS,
      })
      .at(0);

    if (!file) {
      throw new FileNotFoundError(event.aggregateId);
    }

    return Optional.of(file);
  }
}
