export enum typeQueue {
  hydrate = 'hydrate',
  dehydrate = 'dehydrate',
  changeSize = 'changeSize',
}

export type QueueItem = {
  path: string;
  isFolder: boolean;
  type: typeQueue;
  fileId?: string;
};

export type HandleAction = (task: QueueItem) => Promise<void> | void;

export type HandleActions = {
  [key in typeQueue]: HandleAction;
};
