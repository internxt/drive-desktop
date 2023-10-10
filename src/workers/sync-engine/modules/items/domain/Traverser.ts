import { ServerFile } from 'workers/filesystems/domain/ServerFile';
import { ServerFolder } from 'workers/filesystems/domain/ServerFolder';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';

export interface Traverser {
  run: (rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
  }) => Record<string, Folder | File>;

  reset: () => void;
}
