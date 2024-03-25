import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';

export class InMemoryFileRepository implements FileRepository {
  private files: Map<File['uuid'], FileAttributes>;

  private get values(): Array<FileAttributes> {
    return Array.from(this.files.values());
  }

  constructor(files?: Array<File>) {
    this.files = new Map();
    if (files) {
      files.forEach((file) => this.files.set(file.uuid, file.attributes()));
    }
  }

  async searchByUuid(uuid: File['uuid']): Promise<File | undefined> {
    const attributes = this.files.get(uuid);

    if (!attributes) {
      return;
    }

    return File.from(attributes);
  }

  public all(): Promise<Array<File>> {
    const files = [...this.files.values()].map((attributes) =>
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

  async delete(id: File['contentsId']): Promise<void> {
    const deleted = this.files.delete(id);

    if (!deleted) {
      throw new Error('File not found');
    }
  }

  async add(file: File): Promise<void> {
    this.files.set(file.uuid, file.attributes());
  }

  async update(file: File): Promise<void> {
    if (!this.files.has(file.uuid)) {
      throw new FileNotFoundError(file.uuid);
    }

    return this.add(file);
  }
}
