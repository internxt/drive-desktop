import { StorageFile } from '../../../../../domain/StorageFile';
import { StorageFilesRepository } from '../../../../../domain/StorageFilesRepository';
import { StorageFileMother } from '../../../../../../__test-helpers__/StorageFileMother';
import { createReadable } from './createReadable';
import Chance from '../../../../../../../../context/shared/infrastructure/__test-helpers__/Chance';
export async function createFile(repo: StorageFilesRepository): Promise<StorageFile> {
  const content = Chance.tld();
  const file = StorageFileMother.random();

  await repo.store(file, createReadable(content));

  return file;
}
