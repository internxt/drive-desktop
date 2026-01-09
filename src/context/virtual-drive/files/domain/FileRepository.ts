import { File, FileAttributes } from './File';
import { FileStatuses } from './FileStatus';

export abstract class FileRepository {
  abstract all(): Promise<Array<File>>;

  abstract matchingPartial(partial: Partial<FileAttributes>): Array<File>;

  abstract searchByPathPrefix(pathPrefix: string, status?: FileStatuses): Array<File>;

  abstract searchByUuid(uuid: File['uuid']): Promise<File | undefined>;

  abstract searchByContentsId(id: File['contentsId']): Promise<File | undefined>;

  abstract searchByArrayOfContentsId(contentsIds: Array<File['contentsId']>): Promise<Array<File>>;

  abstract upsert(file: File): Promise<boolean>;

  abstract update(file: File): Promise<void>;

  abstract clear(): Promise<void>;
}
