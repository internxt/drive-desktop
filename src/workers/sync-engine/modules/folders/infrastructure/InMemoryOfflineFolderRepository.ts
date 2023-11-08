import {
  OfflineFolder,
  OfflineFolderAttributes,
} from '../domain/OfflineFolder';
import { OfflineFolderRepository } from '../domain/OfflineFolderRepository';

export class InMemoryOfflineFolderRepository
  implements OfflineFolderRepository
{
  private foldersByUuid: Record<
    OfflineFolder['uuid'],
    OfflineFolderAttributes
  > = {};

  private get values(): Array<OfflineFolderAttributes> {
    return Object.values(this.foldersByUuid);
  }

  searchByPartial(
    partial: Partial<OfflineFolderAttributes>
  ): OfflineFolder | undefined {
    const keys = Object.keys(partial) as Array<
      keyof Partial<OfflineFolderAttributes>
    >;

    const folderAttributes = this.values.find((attributes) =>
      keys.every(
        (key: keyof Partial<OfflineFolderAttributes>) =>
          attributes[key] === partial[key]
      )
    );

    if (!folderAttributes) {
      return undefined;
    }

    return OfflineFolder.from(folderAttributes);
  }

  update(folder: OfflineFolder): void {
    this.foldersByUuid[folder.uuid] = folder.attributes();
  }

  remove(folder: OfflineFolder): void {
    delete this.foldersByUuid[folder.uuid];
  }
}
