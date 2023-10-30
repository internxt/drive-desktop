import { FileRepository } from '../domain/FileRepository';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { File } from '../domain/File';

export class FileFinderByContentsId {
  constructor(private readonly repository: FileRepository) {}

  async run(contentsId: string): Promise<File> {
    const file = await this.repository.searchByPartial({ contentsId });

    if (!file) {
      throw new FileNotFoundError(contentsId);
    }

    return file;
  }
}
