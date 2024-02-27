import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class InMemoryFileRepository implements FileRepository {
  private files: Map<File['contentsId'], FileAttributes>;

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

  async searchById(id: number): Promise<File | undefined> {
    const files = this.files.values();

    for (const attributes of files) {
      if (id === attributes.id) {
        return File.from(attributes);
      }
    }

    return undefined;
  }

  async searchByContentsId(id: string): Promise<File | undefined> {
    const attributes = this.files.get(id);

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
    this.files.set(file.contentsId, file.attributes());
  }

  async update(file: File): Promise<void> {
    if (!this.files.has(file.contentsId)) {
      throw new Error('File not found');
    }

    return this.add(file);
  }
}
