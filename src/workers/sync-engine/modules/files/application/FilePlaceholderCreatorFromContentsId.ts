import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import { File } from '../domain/File';
import { FileFinderByContentsId } from './FileFinderByContentsId';

export class FilePlaceholderCreatorFromContentsId {
  constructor(
    private readonly finder: FileFinderByContentsId,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  run(contentsId: File['contentsId']) {
    const file = this.finder.run(contentsId);

    this.placeholderCreator.file(file);
  }
}
