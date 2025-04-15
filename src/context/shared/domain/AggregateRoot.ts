import { AllowedEvents } from '@/context/virtual-drive/shared/infrastructure/AllowedEvents';
import { Primitives } from './value-objects/ValueObject';

export abstract class AggregateRoot {
  private domainEvents: Array<AllowedEvents>;

  constructor() {
    this.domainEvents = [];
  }

  pullDomainEvents(): Array<AllowedEvents> {
    const domainEvents = this.domainEvents.slice();
    this.domainEvents = [];

    return domainEvents;
  }

  record(event: AllowedEvents): void {
    this.domainEvents.push(event);
  }

  abstract attributes(): Record<string, Primitives>;
}
