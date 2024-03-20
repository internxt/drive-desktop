export interface ContentsRepository {
  read(path: string): Promise<Buffer>;

  forget(path: string): Promise<void>;
}
