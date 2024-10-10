import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';

export type FilesIndexedByPath<T> = Map<AbsolutePath, T>;
