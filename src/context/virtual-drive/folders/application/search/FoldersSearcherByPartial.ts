import { Service } from 'diod';
import { FolderRepository } from '../../domain/FolderRepository';
import { Folder, FolderAttributes } from '../../domain/Folder';

@Service()
export class FoldersSearcherByPartial {
  constructor(private readonly repository: FolderRepository) {}

  async run(partial: Partial<FolderAttributes>): Promise<Array<Folder>> {
    return this.repository.matchingPartial(partial);
  }
}
