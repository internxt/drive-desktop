import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class ChildrenFilesSearcher {
  constructor(private readonly repository: FileRepository) {}

  run(folderUuid: File['folderUuid']): Array<File> {
    const files = this.repository.matchingPartial({ folderUuid });

    return files;
  }
}
