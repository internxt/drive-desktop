import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class InMemoryFileRepository implements FileRepository {
  private files: Map<string, FileAttributes>;

  private get values(): Array<FileAttributes> {
    return Array.from(this.files.values());
  }

  constructor(files?: Array<File>) {
    this.files = new Map();
    if (files) {
      files.forEach((file) =>
        this.files.set(file.contentsId, file.attributes())
      );
    }
  }

  public all(): Promise<Array<File>> {
    const files = [...this.files.values()].map((attributes) =>
      File.from(attributes)
    );
    return Promise.resolve(files);
  }

  searchByPartial(partial: Partial<FileAttributes>): File | undefined {
    const keys = Object.keys(partial) as Array<keyof Partial<FileAttributes>>;

    const file = this.values.find((attributes) => {
      return keys.every((key: keyof FileAttributes) => {
        if (key === 'contentsId') {
          return (
            attributes[key].normalize() == (partial[key] as string).normalize()
          );
        }

        return attributes[key] == partial[key];
      });
    });

    if (file) {
      return File.from(file);
    }

    return undefined;
  }

  listByPartial(partial: Partial<FileAttributes>): Promise<Array<File>> {
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

    const files = filesAttributes.map((attributes) => File.from(attributes));

    return Promise.resolve(files);
  }

  async delete(id: File['contentsId']): Promise<void> {
    const deleted = this.files.delete(id);

    if (!deleted) {
      throw new Error('File not found');
    }
  }

  async add(file: File): Promise<void> {
    this.files.set(file.contentsId, file.attributes());
  }

  async update(file: File): Promise<void> {
    if (!this.files.has(file.contentsId)) {
      throw new Error('File not found');
    }

    return this.add(file);
  }
}
