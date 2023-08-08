import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';

/** @deprecated */
export type ItemsIndexedByPath = Record<string, Folder | File>;
