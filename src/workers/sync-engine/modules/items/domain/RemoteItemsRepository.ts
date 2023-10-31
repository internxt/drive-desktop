import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';

export interface RemoteItemsRepository {
  getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }>;
}
