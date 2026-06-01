import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeTemporalFileRepository } from './NodeTemporalFileRepository';
import { TemporalFilePath } from '../domain/TemporalFilePath';

describe('NodeTemporalFileRepository', () => {
  let folder: string;
  let repository: NodeTemporalFileRepository;

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'internxt-temporal-files-'));
    repository = new NodeTemporalFileRepository(folder);
    repository.init();
  });

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it('should return empty when mapped file no longer exists on disk', async () => {
    const documentPath = new TemporalFilePath('/Documents/.test-file.txt.swp');

    await repository.create(documentPath);
    const temporalFile = await repository.find(documentPath);
    const contentFilePath = temporalFile.get().contentFilePath;

    await rm(contentFilePath, { force: true });

    const result = await repository.find(documentPath);

    expect(result.isPresent()).toBe(false);
  });

  it('should ignore ENOENT when deleting a stale mapped file', async () => {
    const documentPath = new TemporalFilePath('/Documents/.test-file.txt.swp');

    await repository.create(documentPath);
    const temporalFile = await repository.find(documentPath);
    const contentFilePath = temporalFile.get().contentFilePath;

    await rm(contentFilePath, { force: true });

    await expect(repository.delete(documentPath)).resolves.toBeUndefined();
  });
});
