import { AuthorizedClients } from '../../../../apps/shared/HttpClient/Clients';
import { getClients } from '../../../../apps/shared/HttpClient/background-process-clients';

export class BackgroundProcessAuthorizedClients implements AuthorizedClients {
  public drive: AuthorizedClients['drive'];
  public newDrive: AuthorizedClients['drive'];

  constructor() {
    const { drive, newDrive } = getClients();

    this.drive = drive as AuthorizedClients['drive'];
    this.newDrive = newDrive as AuthorizedClients['drive'];
  }
}
