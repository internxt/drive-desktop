import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

export class InMemoryOfflineFileRepository implements OfflineFileRepository {
  private readonly files = new Map<string, OfflineFile>();

  async save(file: OfflineFile): Promise<void> {
    this.files.set(file.id, file);
  }

  async searchByPartial(
    partial: Partial<OfflineFileAttributes>
  ): Promise<OfflineFile | undefined> {
    const keys = Object.keys(partial) as Array<
      keyof Partial<OfflineFileAttributes>
    >;

    const values = Array.from(this.files.values());

    const file = values.find((attributes) => {
      return keys.every(
        (key: keyof OfflineFileAttributes) => attributes[key] == partial[key]
      );
    });

    return file;
  }
}
