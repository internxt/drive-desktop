import { File } from '../domain/File';
import { FilePlaceholderCreator } from '../infrastructure/FilePlaceholderCreator';
import { FileFinderByContentsId } from './FileFinderByContentsId';

export class FilePlaceholderCreatorFromContentsId {
  constructor(
    private readonly finder: FileFinderByContentsId,
    private readonly placeholderCreator: FilePlaceholderCreator
  ) {}

  run(contentsId: File['contentsId']) {
    const file = this.finder.run(contentsId);

    this.placeholderCreator.run(file);
  }
}
