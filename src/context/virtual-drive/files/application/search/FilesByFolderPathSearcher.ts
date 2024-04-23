import { Service } from 'diod';
import { SingleFolderMatchingFinder } from '../../../folders/application/SingleFolderMatchingFinder';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import { FileStatuses } from '../../domain/FileStatus';

@Service()
export class FilesByFolderPathSearcher {
  constructor(
    private readonly repository: FileRepository,
    private readonly singleFolderMatchingFinder: SingleFolderMatchingFinder
  ) {}

  async run(path: string): Promise<Array<File['nameWithExtension']>> {
    const folder = await this.singleFolderMatchingFinder.run({ path });

    const files = this.repository.matchingPartial({
      folderId: folder.id,
      status: FileStatuses.EXISTS,
    });

    return files.map((file) => file.nameWithExtension);
  }
}
