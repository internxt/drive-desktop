import * as uuid from 'uuid';

type DomainEventAttributes = any;

export abstract class DomainEvent {
  static EVENT_NAME: string;

  readonly aggregateId: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredOn?: Date;

  constructor(params: { eventName: string; aggregateId: string; eventId?: string; occurredOn?: Date }) {
    const { aggregateId, eventName, eventId, occurredOn } = params;
    this.aggregateId = aggregateId;
    this.eventId = eventId || uuid.v4();
    this.eventName = `${eventName}`;
    this.occurredOn = occurredOn || new Date();
  }

  abstract toPrimitives(): DomainEventAttributes;
}
