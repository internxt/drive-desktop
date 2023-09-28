import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';

export interface PlaceholderCreator {
  folder: (folder: Folder) => void;
  file: (file: File) => void;
}
