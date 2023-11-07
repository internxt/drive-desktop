import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class FileFinderByContentsId {
  constructor(private readonly repository: FileRepository) {}

  run(contentsId: string): File {
    const file = this.repository.searchByPartial({ contentsId });

    if (!file) {
      throw new FileNotFoundError(contentsId);
    }

    return file;
  }
}
