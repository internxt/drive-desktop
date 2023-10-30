import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import { File } from '../domain/File';
import { FileFinderByContentsId } from './FileFinderByContentsId';

export class FilePlaceholderCreatorFromContentsId {
  constructor(
    private readonly finder: FileFinderByContentsId,
    private readonly placeholderCreator: PlaceholderCreator
  ) {}

  async run(contentsId: File['contentsId']): Promise<void> {
    const file = await this.finder.run(contentsId);

    this.placeholderCreator.file(file);
  }
}
