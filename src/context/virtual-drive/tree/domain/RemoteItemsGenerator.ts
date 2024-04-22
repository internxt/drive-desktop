import { ServerFile } from '../../../shared/domain/ServerFile';
import { ServerFolder } from '../../../shared/domain/ServerFolder';

export abstract class RemoteItemsGenerator {
  abstract getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }>;
}
