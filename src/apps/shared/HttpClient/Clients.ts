import { Axios } from 'axios';

export type AuthorizedClients = {
  drive: Axios;
  newDrive: Axios;
};
