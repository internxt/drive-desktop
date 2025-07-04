import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/context/virtual-drive/files/domain/PlaceholderId';

export enum typeQueue {
  hydrate = 'hydrate',
  dehydrate = 'dehydrate',
}

export type QueueItem = {
  path: AbsolutePath;
  type: typeQueue;
  uuid: FileUuid;
};

export type HandleAction = (task: QueueItem) => Promise<void> | void;

export type HandleActions = {
  [key in typeQueue]: HandleAction;
};
