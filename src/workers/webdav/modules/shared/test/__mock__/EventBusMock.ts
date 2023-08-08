import { DomainEvent } from '../../domain/DomainEvent';
import { WebdavServerEventBus } from '../../domain/WebdavServerEventBus';
import { DomainEventSubscribers } from '../../infrastructure/DomainEventSubscribers';

export class EventBusMock implements WebdavServerEventBus {
  public publishMock = jest.fn();

  async publish(events: DomainEvent[]) {
    this.publishMock(events);
  }

  addSubscribers(subscribers: DomainEventSubscribers): void {
    //
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
