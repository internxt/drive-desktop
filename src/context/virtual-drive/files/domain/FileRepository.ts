import { File, FileAttributes } from './File';

export interface FileRepository {
  all(): Promise<Array<File>>;

  matchingPartial(partial: Partial<FileAttributes>): Array<File>;

  searchByUuid(uuid: File['uuid']): Promise<File | undefined>;

  searchByContentsId(id: File['contentsId']): Promise<File | undefined>;

  // delete(id: File['contentsId']): Promise<void>;

  add(file: File): Promise<void>;

  update(file: File): Promise<void>;
}
