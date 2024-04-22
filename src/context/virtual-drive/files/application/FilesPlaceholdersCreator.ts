import { Service } from 'diod';
import { File } from '../domain/File';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

@Service()
export class FilesPlaceholderCreator {
  constructor(private readonly local: LocalFileSystem) {}

  async run(files: Array<File>): Promise<void> {
    const creationPromises = files.map((file) =>
      this.local.createPlaceHolder(file)
    );

    await Promise.all(creationPromises);
  }
}
