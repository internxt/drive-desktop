import { SyncEngineDomainEventSubscribers } from '../../../../apps/sync-engine/dependency-injection/SyncEngineDomainEventSubscribers';
import { DomainEvent } from '../../../shared/domain/DomainEvent';

export interface EventBus {
  publish(events: Array<DomainEvent>): Promise<void>;
  addSubscribers(subscribers: SyncEngineDomainEventSubscribers): void;
}
