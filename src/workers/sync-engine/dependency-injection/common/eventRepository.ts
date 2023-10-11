import { EventRepository } from 'workers/sync-engine/modules/shared/domain/EventRepository';
import { InMemoryEventRepository } from 'workers/sync-engine/modules/shared/infrastructure/InMemoryEventHistory';

export class DependencyInjectionEventRepository {
  private static history: EventRepository;

  static get(): EventRepository {
    if (DependencyInjectionEventRepository.history) {
      return DependencyInjectionEventRepository.history;
    }

    DependencyInjectionEventRepository.history = new InMemoryEventRepository();

    return DependencyInjectionEventRepository.history;
  }
}
