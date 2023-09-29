import { isFilePlaceholderId } from '../../modules/placeholders/domain/FilePlaceholderId';
import { isFolderPlaceholderId } from '../../modules/placeholders/domain/FolderPlaceholderId';

export abstract class CallbackController {
  protected trim(id: string): string {
    return id.replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1F\x7F-\x9F]/g,
      ''
    );
  }

  protected isFilePlaceholder(id: string): boolean {
    // make sure the id is trimmed before comparing
    // if it was already trimmed should not change its length
    const trimmed = this.trim(id);

    return isFilePlaceholderId(trimmed);
  }

  protected isFolderPlaceholder(id: string): boolean {
    // make sure the id is trimmed before comparing
    // if it was already trimmed should not change its length
    const trimmed = this.trim(id);

    return isFolderPlaceholderId(trimmed);
  }
}
