import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { EventBus } from '../domain/EventBus';

export class EventBusMock implements EventBus {
  public publishMock = vi.fn();
  public addSubscribersMock = vi.fn();

  async publish(events: DomainEvent[]) {
    this.publishMock(events);
  }

  addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void {
    this.addSubscribers(subscribers);
  }

  assertLastPublishedEventIs(expectedEvent: DomainEvent) {
    const publishSpyCalls = this.publishMock.mock.calls;

    expect(publishSpyCalls.length).toBeGreaterThan(0);

    const lastPublishSpyCall = publishSpyCalls[publishSpyCalls.length - 1];
    const lastPublishedEvent = lastPublishSpyCall[0][0];

    const expected = this.getDataFromDomainEvent(expectedEvent);
    const published = this.getDataFromDomainEvent(lastPublishedEvent);

    expect(expected).toMatchObject(published);
  }

  private getDataFromDomainEvent(event: DomainEvent) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { eventId, ...attributes } = event;

    return attributes;
  }
}
