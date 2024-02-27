import { ServerFile } from '../../../shared/domain/ServerFile';
import { ServerFolder } from '../../../shared/domain/ServerFolder';

export interface RemoteItemsGenerator {
  getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }>;
}
