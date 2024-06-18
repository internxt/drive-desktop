import { Service } from 'diod';
import { FileRepository } from '../../domain/FileRepository';
import { File } from '../../domain/File';

@Service()
export class AllFilesIndexedByPath {
  constructor(private readonly repository: FileRepository) {}

  async run(): Promise<Map<string, File>> {
    const all = await this.repository.all();

    const map = new Map<string, File>();

    all.forEach((file) => map.set(file.path, file));

    return map;
  }
}
