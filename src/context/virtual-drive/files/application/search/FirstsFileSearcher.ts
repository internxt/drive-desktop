import { Service } from 'diod';
import { File, FileAttributes } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';

@Service()
export class FirstsFileSearcher {
  constructor(private readonly repository: FileRepository) {}

  async run(attributes: Partial<FileAttributes>): Promise<File | undefined> {
    const files = this.repository.matchingPartial(attributes);

    if (!files) return;

    return files[0];
  }
}
