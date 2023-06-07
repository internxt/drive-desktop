import { WebdavDomainEvent } from '../../domain/WebdavDomainEvent';
import { WebdavServerEventBus } from '../../domain/WebdavServerEventBus';
import { DomainEventSubscribers } from '../../infrastructure/DomainEventSubscribers';

export class EventBusMock implements WebdavServerEventBus {
  private publishSpy = jest.fn();

  async publish(events: WebdavDomainEvent[]) {
    this.publishSpy(events);
  }

  addSubscribers(subscribers: DomainEventSubscribers): void {
    //
  }

  assertLastPublishedEventIs(expectedEvent: WebdavDomainEvent) {
    const publishSpyCalls = this.publishSpy.mock.calls;

    expect(publishSpyCalls.length).toBeGreaterThan(0);

    const lastPublishSpyCall = publishSpyCalls[publishSpyCalls.length - 1];
    const lastPublishedEvent = lastPublishSpyCall[0][0];

    const expected = this.getDataFromDomainEvent(expectedEvent);
    const published = this.getDataFromDomainEvent(lastPublishedEvent);

    expect(expected).toMatchObject(published);
  }

  private getDataFromDomainEvent(event: WebdavDomainEvent) {
    const { eventId, ...attributes } = event;

    return attributes;
  }
}
