import { AuthorizedClients } from 'apps/shared/HttpClient/Clients';
import { getClients } from 'apps/shared/HttpClient/backgroud-process-clients';

export class DependencyInjectionHttpClientsProvider {
  private static clients: AuthorizedClients;

  static get(): AuthorizedClients {
    if (DependencyInjectionHttpClientsProvider.clients) {
      return DependencyInjectionHttpClientsProvider.clients;
    }

    const clients = getClients();

    DependencyInjectionHttpClientsProvider.clients = clients;

    return clients;
  }
}
