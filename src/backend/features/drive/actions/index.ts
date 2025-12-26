import { createFile } from './services/create-file';
import { createFolder } from './services/create-folder';
import { createPendingItems } from './services/create-pending-items';
import { replaceFile } from './services/replace-file';

export const Actions = {
  createFile,
  createFolder,
  replaceFile,
  createPendingItems,
};
