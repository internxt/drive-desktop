import { XFile } from './File';
import { XFolder } from './Folder';

export type ItemsIndexedByPath = Record<string, XFolder | XFile>;
