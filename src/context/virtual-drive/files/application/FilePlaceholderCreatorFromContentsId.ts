import { Service } from 'diod';
import { File } from '../domain/File';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { SingleFileMatchingFinder } from './SingleFileMatchingFinder';

@Service()
export class FilePlaceholderCreatorFromContentsId {
  constructor(
    private readonly finder: SingleFileMatchingFinder,
    private readonly local: LocalFileSystem
  ) {}

  async run(contentsId: File['contentsId']) {
    const file = await this.finder.run({ contentsId });

    this.local.createPlaceHolder(file);
  }
}
