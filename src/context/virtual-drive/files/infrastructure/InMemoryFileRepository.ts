import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';

export class InMemoryFileRepository implements FileRepository {
  private filesByUuid: Map<File['uuid'], FileAttributes>;
  private filesByContentsId: Map<File['contentsId'], FileAttributes>;

  private get values(): Array<FileAttributes> {
    return Array.from(this.filesByUuid.values());
  }

  constructor(files?: Array<File>) {
    this.filesByUuid = new Map();
    this.filesByContentsId = new Map();

    if (files) {
      files.forEach((file) => {
        const attributes = file.attributes();

        this.filesByUuid.set(file.uuid, attributes);
        this.filesByContentsId.set(file.contentsId, attributes);
      });
    }
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

  // async delete(id: File['contentsId']): Promise<void> {
  //   const file = this.filesByContentsId(id);
  //   const deleted = this.filesByUuid.delete(id);

  //   if (!deleted) {
  //     throw new Error('File not found');
  //   }
  // }

  async add(file: File): Promise<void> {
    const attributes = file.attributes();

    this.filesByUuid.set(file.uuid, attributes);
    this.filesByContentsId.set(file.contentsId, attributes);
  }

  async update(file: File): Promise<void> {
    if (!this.filesByUuid.has(file.uuid)) {
      throw new FileNotFoundError(file.uuid);
    }

    return this.add(file);
  }
}
