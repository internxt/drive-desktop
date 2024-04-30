import { StorageFile } from '../../../../../../../../src/context/storage/StorageFiles/domain/StorageFile';
import { StorageFilesRepository } from '../../../../../../../../src/context/storage/StorageFiles/domain/StorageFilesRepository';
import Chance from '../../../../../../shared/infrastructure/Chance';
import { StorageFileMother } from '../../../../domain/StorageFileMother';
import { createReadable } from '../typeorm/createReadable';

export async function createFile(
  repo: StorageFilesRepository
): Promise<StorageFile> {
  const content = Chance.tld();
  const file = StorageFileMother.random();

  await repo.store(file, createReadable(content));

  return file;
}
