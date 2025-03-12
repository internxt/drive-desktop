import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { Service } from 'diod';

@Service()
export class InMemoryFileRepository implements FileRepository {
  private filesByUuid: Map<File['uuid'], FileAttributes>;
  private filesByContentsId: Map<File['contentsId'], FileAttributes>;

  private get values(): Array<FileAttributes> {
    return Array.from(this.filesByUuid.values());
  }

  constructor() {
    this.filesByUuid = new Map();
    this.filesByContentsId = new Map();
  }

  async searchByUuid(uuid: File['uuid']): Promise<File | undefined> {
    const attributes = this.filesByUuid.get(uuid);

    if (!attributes) {
      return;
    }

    return File.from(attributes);
  }

  async searchByContentsId(
    contentsId: File['contentsId']
  ): Promise<File | undefined> {
    const attributes = this.filesByContentsId.get(contentsId);

    if (!attributes) {
      return;
    }

    return File.from(attributes);
  }

  async searchByArrayOfContentsId(
    contentsIds: Array<File['contentsId']>
  ): Promise<Array<File>> {
    const files = contentsIds
      .map((contentsId) => {
        const file = this.filesByContentsId.get(contentsId);

        if (file) {
          return File.from(file);
        }

        return undefined;
      })
      .filter((file) => file !== undefined) as Array<File>;
    return files;
  }

  public all(): Promise<Array<File>> {
    const files = [...this.filesByUuid.values()].map((attributes) =>
      File.from(attributes)
    );
    return Promise.resolve(files);
  }

  matchingPartial(partial: Partial<FileAttributes>): Array<File> {
    const keys = Object.keys(partial) as Array<keyof Partial<FileAttributes>>;

    const filesAttributes = this.values.filter((attributes) => {
      return keys.every((key: keyof FileAttributes) => {
        if (key === 'contentsId') {
          return (
            attributes[key].normalize() == (partial[key] as string).normalize()
          );
        }

        return attributes[key] == partial[key];
      });
    });

    if (!filesAttributes) {
      return [];
    }

    return filesAttributes.map((attributes) => File.from(attributes));
  }

  async upsert(file: File): Promise<boolean> {
    const attributes = file.attributes();

    const isAlreadyStored =
      this.filesByUuid.has(file.uuid) ||
      this.filesByContentsId.has(file.contentsId);

    if (isAlreadyStored) {
      this.filesByUuid.delete(file.uuid);
      this.filesByContentsId.delete(file.contentsId);
    }

    this.filesByUuid.set(file.uuid, attributes);
    this.filesByContentsId.set(file.contentsId, attributes);

    return isAlreadyStored;
  }

  async update(file: File): Promise<void> {
    if (!this.filesByUuid.has(file.uuid)) {
      throw new FileNotFoundError(file.uuid);
    }

    this.upsert(file);
  }

  async clear(): Promise<void> {
    this.filesByUuid.clear();
    this.filesByContentsId.clear();
  }
}
