import { File, FileAttributes } from './File';

export abstract class FileRepository {
  abstract all(): Promise<Array<File>>;

  abstract matchingPartial(partial: Partial<FileAttributes>): Array<File>;

  abstract searchByUuid(uuid: File['uuid']): Promise<File | undefined>;

  abstract searchByContentsId(
    id: File['contentsId']
  ): Promise<File | undefined>;

  abstract upsert(file: File): Promise<boolean>;

  abstract update(file: File): Promise<void>;

  abstract clear(): Promise<void>;
}
