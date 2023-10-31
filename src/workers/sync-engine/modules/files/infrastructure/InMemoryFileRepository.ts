import { Nullable } from 'shared/types/Nullable';
import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class InMemoryFileRepository implements FileRepository {
  public filesAttributes: Record<string, FileAttributes> = {};

  all(): Promise<Array<File>> {
    return Promise.resolve(
      Object.values(this.filesAttributes).map((attributes) =>
        File.from(attributes)
      )
    );
  }

  async searchByPartial(
    partial: Partial<FileAttributes>
  ): Promise<Nullable<File>> {
    const keys = Object.keys(partial) as Array<keyof Partial<FileAttributes>>;

    const fileAttributes = Object.values(this.filesAttributes).find(
      (attributes) => {
        return keys.every((key: keyof FileAttributes) => {
          if (key === 'contentsId') {
            return (
              (attributes[key] as string).normalize() ==
              (partial[key] as string).normalize()
            );
          }

          return attributes[key] == partial[key];
        });
      }
    );

    if (!fileAttributes) {
      return undefined;
    }

    return File.from(fileAttributes);
  }

  async delete(file: File): Promise<void> {
    delete this.filesAttributes[file.path.value];
  }

  async add(file: File): Promise<void> {
    if (this.filesAttributes[file.path.value]) {
      throw new Error('Cannot add a file that already exists');
    }

    this.filesAttributes[file.path.value] = file.attributes();
  }

  async update(file: File): Promise<void> {
    this.filesAttributes[file.path.value] = file.attributes();
  }
}
