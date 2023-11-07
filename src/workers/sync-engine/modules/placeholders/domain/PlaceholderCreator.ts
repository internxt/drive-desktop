import { Folder } from '../../folders/domain/Folder';

export interface PlaceholderCreator {
  folder: (folder: Folder) => void;
}
