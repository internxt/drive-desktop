import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class InMemoryFileRepository implements FileRepository {
  private files: Map<string, FileAttributes>;

  private get values(): Array<FileAttributes> {
    return Array.from(this.files.values());
  }

  constructor() {
    this.files = new Map();
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

  async delete(id: File['contentsId']): Promise<void> {
    const deleted = this.files.delete(id);

    if (!deleted) {
      throw new Error('File not found');
    }
  }

  async add(file: File): Promise<void> {
    this.files.set(file.contentsId, file.attributes());
  }

  async update(file: File, oldContentsId?: File['contentsId']): Promise<void> {
    if (!this.files.has(file.contentsId) || (oldContentsId && !this.files.has(oldContentsId))) {
      throw new Error('File not found');
    }

    if (oldContentsId) {
      this.files.delete(oldContentsId);
    }

    return this.add(file);
  }
}
