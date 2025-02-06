import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { File } from '../domain/File';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class FileFinderByContentsId {
  constructor(private readonly repository: InMemoryFileRepository) {}

  run(contentsId: string): File {
    const file = this.repository.searchByPartial({ contentsId });

    if (!file) {
      throw new FileNotFoundError(contentsId);
    }

    return file;
  }
}
