import { Axios } from 'axios';

export abstract class AuthorizedClients {
  abstract drive: Axios;
  abstract newDrive: Axios;
}
