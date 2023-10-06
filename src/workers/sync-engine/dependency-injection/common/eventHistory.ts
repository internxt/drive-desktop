import { EventHistory } from 'workers/sync-engine/modules/shared/domain/EventRepository';
import { InMemoryEventHistory } from 'workers/sync-engine/modules/shared/infrastructure/InMemoryEventHistory';

export class DependencyInjectionEventHistory {
  private static history: EventHistory;

  static get(): EventHistory {
    if (DependencyInjectionEventHistory.history) {
      return DependencyInjectionEventHistory.history;
    }

    DependencyInjectionEventHistory.history = new InMemoryEventHistory();

    return DependencyInjectionEventHistory.history;
  }
}
