import { Primitives } from './value-objects/ValueObject';
import { DomainEvent } from './DomainEvent';

export abstract class AggregateRoot {
  private domainEvents: Array<DomainEvent>;

  constructor() {
    this.domainEvents = [];
  }

  pullDomainEvents(): Array<DomainEvent> {
    const domainEvents = this.domainEvents.slice();
    this.domainEvents = [];

    return domainEvents;
  }

  record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  abstract attributes(): Record<string, Primitives>;

  toString(): string {
    return JSON.stringify(this.attributes(), null, 2);
  }
}
