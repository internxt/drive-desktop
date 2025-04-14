import { InMemoryEventRepository } from '../../../../context/virtual-drive/shared/infrastructure/InMemoryEventHistory';

export class DependencyInjectionEventRepository {
  private static history: InMemoryEventRepository;

  static get(): InMemoryEventRepository {
    if (DependencyInjectionEventRepository.history) {
      return DependencyInjectionEventRepository.history;
    }

    DependencyInjectionEventRepository.history = new InMemoryEventRepository();

    return DependencyInjectionEventRepository.history;
  }
}
