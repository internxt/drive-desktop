import { File } from '../../domain/File';

export interface ReplaceFileDTO {
  fileId: File['contentsId'];
  size: File['size'];
}
