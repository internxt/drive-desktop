import { NodeJsEventBus } from 'workers/sync-engine/modules/shared/infrastructure/NodeJsEventBus';

export class DependencyInjectionEventBus {
  private static _bus: NodeJsEventBus;

  static get bus(): NodeJsEventBus {
    if (DependencyInjectionEventBus._bus) {
      return DependencyInjectionEventBus._bus;
    }

    DependencyInjectionEventBus._bus = new NodeJsEventBus();

    return DependencyInjectionEventBus._bus;
  }
}
