import { OldFileRepository } from '../domain/OldFileRepository';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { File } from '../domain/File';

export class FileFinderByContentsId {
  constructor(private readonly repository: OldFileRepository) {}

  run(contentsId: string): File {
    const file = this.repository.searchByPartial({ contentsId });

    if (!file) {
      throw new FileNotFoundError(contentsId);
    }

    return file;
  }
}
