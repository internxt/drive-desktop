import { ipcRenderer } from 'electron';
import { WebdavDomainEvent } from '../domain/WebdavDomainEvent';
import { WebdavServerEventBus } from '../domain/WebdavServerEventBus';

export class InterProcessEventEmitter implements WebdavServerEventBus {
  async publish(events: Array<WebdavDomainEvent>): Promise<void> {
    events.map((event) =>
      ipcRenderer.send(event.eventName, event.toPrimitives())
    );
  }
}
