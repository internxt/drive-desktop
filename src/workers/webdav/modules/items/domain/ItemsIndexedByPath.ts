import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';

export type ItemsIndexedByPath = Record<string, Folder | File>;
