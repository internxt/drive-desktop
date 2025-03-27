import { File } from '../domain/File';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
import { FileFinderByContentsId } from './FileFinderByContentsId';

export class FilePlaceholderCreatorFromContentsId {
  constructor(private readonly finder: FileFinderByContentsId, private readonly local: NodeWinLocalFileSystem) {}

  run(contentsId: File['contentsId']) {
    const file = this.finder.run(contentsId);

    this.local.createPlaceHolder(file);
  }
}
