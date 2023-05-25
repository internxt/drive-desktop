import { Nullable } from '../../../shared/types/Nullable';
import { XFile } from './File';
import { XFolder } from './Folder';
import { XPath } from './XPath';

export interface ItemRepository {
  listContents(folderPath: string): Array<XPath>;

  searchItem(pathLike: string): Nullable<XFile | XFolder>;

  searchParentFolder(itemPath: string): Nullable<XFolder>;

  createFolder(folderPath: string, parentFolder: XFolder): Promise<void>;

  deleteFolder(item: XFolder): Promise<void>;

  deleteFile(file: XFile): Promise<void>;

  addFile(file: XFile): Promise<void>;

  updateName(item: XFile | XFolder): Promise<void>;

  updateParentDir(item: XFile | XFolder): Promise<void>;
}
