import { File, FileAttributes } from './File';

export abstract class FileRepository {
  abstract all(): Promise<Array<File>>;
  abstract searchByPartial(partial: Partial<FileAttributes>): File | undefined;
  abstract allSearchByPartial(
    partial: Partial<FileAttributes>
  ): Promise<Array<File>>;
  abstract delete(id: File['contentsId']): Promise<void>;
  abstract add(file: File): Promise<void>;
  abstract update(file: File): Promise<void>;
  abstract matchingPartial(partial: Partial<FileAttributes>): Array<File>;
  abstract upsert(file: File): Promise<boolean>;
  abstract updateContentsAndSize(
    file: File,
    newContentsId: File['contentsId'],
    newSize: File['size']
  ): Promise<File>;
}
