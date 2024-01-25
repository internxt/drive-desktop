import { DomainEvent } from '../../../../../src/context/shared/domain/DomainEvent';
import { EventBus } from '../../../../../src/context/virtual-drive/shared/domain/EventBus';
import { SyncEngineDomainEventSubscribers } from '../../../../../src/apps/sync-engine/dependency-injection/SyncEngineDomainEventSubscribers';

export class EventBusMock implements EventBus {
  public publishMock = jest.fn();

  async publish(events: DomainEvent[]) {
    this.publishMock(events);
  }

  addSubscribers(_subscribers: SyncEngineDomainEventSubscribers): void {
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
