import { EventBus } from '../../modules/shared/domain/EventBus';
import { NodeJsEventBus } from '../../modules/shared/infrastructure/NodeJsEventBus';

export class DependencyInjectionEventBus {
  private static _bus: NodeJsEventBus;

  static get bus(): EventBus {
    if (DependencyInjectionEventBus._bus) {
      return DependencyInjectionEventBus._bus;
    }

    DependencyInjectionEventBus._bus = new NodeJsEventBus();

    return DependencyInjectionEventBus._bus;
  }
}
