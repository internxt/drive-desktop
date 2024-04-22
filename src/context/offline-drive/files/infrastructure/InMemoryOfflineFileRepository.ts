import { Service } from 'diod';
import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

@Service()
export class InMemoryOfflineFileRepository implements OfflineFileRepository {
  private readonly files = new Map<string, OfflineFileAttributes>();

  async save(file: OfflineFile): Promise<void> {
    this.files.set(file.id.value, file.attributes());
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

    if (!file) {
      return undefined;
    }

    return OfflineFile.from(file);
  }

  async delete(id: OfflineFile['id']): Promise<void> {
    this.files.delete(id.value);
  }

  async all(): Promise<Array<OfflineFile>> {
    const fileAttributes = Array.from(this.files);
    return fileAttributes.map(([_, attributes]) =>
      OfflineFile.from(attributes)
    );
  }
}
