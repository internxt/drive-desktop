import { Axios } from 'axios';
import { getClients } from '../../../shared/HttpClient/backgroud-process-clients';
import { DependencyContainerFactory } from './DependencyContainerFactory';

export interface SharedDepencies {
  drive: Axios;
  newDrive: Axios;
}

class SharedDepenciesContainerFactory extends DependencyContainerFactory<SharedDepencies> {
  async create(): Promise<SharedDepencies> {
    const clients = getClients();

    return {
      drive: clients.drive,
      newDrive: clients.newDrive,
    };
  }
}

export const sharedDepenciesContainerFactory =
  new SharedDepenciesContainerFactory();
