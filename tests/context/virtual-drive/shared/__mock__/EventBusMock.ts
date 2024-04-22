import { DomainEvent } from '../../../../../src/context/shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../../src/context/shared/domain/DomainEventSubscriber';
import { EventBus } from '../../../../../src/context/virtual-drive/shared/domain/EventBus';

export class EventBusMock implements EventBus {
  public publishMock = jest.fn();
  public addSubscribersMock = jest.fn();

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
    const { eventId, ...attributes } = event;

    return attributes;
  }
}
