import { FilePlaceholderId, isFilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId, isFolderPlaceholderId } from '../../../../context/virtual-drive/folders/domain/FolderPlaceholderId';
import { trimPlaceholderId } from './placeholder-id';

export abstract class CallbackController {
  protected isFilePlaceholder(id: FilePlaceholderId | FolderPlaceholderId): id is FilePlaceholderId {
    const trimmed = trimPlaceholderId({ placeholderId: id });
    return isFilePlaceholderId(trimmed);
  }

  protected isFolderPlaceholder(id: FilePlaceholderId | FolderPlaceholderId): id is FolderPlaceholderId {
    const trimmed = trimPlaceholderId({ placeholderId: id });
    return isFolderPlaceholderId(trimmed);
  }
}
