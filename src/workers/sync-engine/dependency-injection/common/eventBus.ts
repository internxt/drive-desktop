import { EventRecorder } from '../../modules/shared/infrastructure/EventRecorder';
import { EventBus } from '../../modules/shared/domain/EventBus';
import { NodeJsEventBus } from '../../modules/shared/infrastructure/NodeJsEventBus';
import { DependencyInjectionEventRepository } from './eventRepository';

export class DependencyInjectionEventBus {
  private static _bus: EventBus;

  static get bus(): EventBus {
    if (DependencyInjectionEventBus._bus) {
      return DependencyInjectionEventBus._bus;
    }

    const eventBus = new NodeJsEventBus();

    const eventHistory = DependencyInjectionEventRepository.get();

    const bus = new EventRecorder(eventHistory, eventBus);

    DependencyInjectionEventBus._bus = bus;

    return DependencyInjectionEventBus._bus;
  }
}
