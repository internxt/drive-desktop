import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { moveWithoutOverwrite } from './move-without-overwrite';

describe('move-without-overwrite', () => {
  let folder: ReturnType<typeof join>;
  let props: Parameters<typeof moveWithoutOverwrite>[0];

  beforeEach(async () => {
    folder = join(TEST_FILES, randomUUID());
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'source.txt'), 'source');
    props = { source: join(folder, 'source.txt'), destination: join(folder, 'recovery', 'Docs', 'source.txt') };
  });

  it('should move the file creating the missing destination folders', async () => {
    // When
    const error = await moveWithoutOverwrite(props);
    // Then
    expect(error).toBeUndefined();
    expect(await readFile(props.destination, 'utf8')).toBe('source');
  });

  it('should move a folder with its contents', async () => {
    // Given
    await mkdir(join(folder, 'Docs'));
    await writeFile(join(folder, 'Docs', 'file.txt'), 'file');
    props = { source: join(folder, 'Docs'), destination: join(folder, 'recovery', 'Docs') };
    // When
    const error = await moveWithoutOverwrite(props);
    // Then
    expect(error).toBeUndefined();
    expect(await readFile(join(folder, 'recovery', 'Docs', 'file.txt'), 'utf8')).toBe('file');
  });

  it('should return DESTINATION_EXISTS and keep both files when the destination exists', async () => {
    // Given
    await mkdir(join(folder, 'recovery', 'Docs'), { recursive: true });
    await writeFile(props.destination, 'preserved');
    // When
    const error = await moveWithoutOverwrite(props);
    // Then
    expect(error?.code).toBe('DESTINATION_EXISTS');
    expect(await readFile(props.source, 'utf8')).toBe('source');
    expect(await readFile(props.destination, 'utf8')).toBe('preserved');
  });

  it('should return SOURCE_NOT_FOUND when the source does not exist', async () => {
    // Given
    props.source = join(folder, 'missing.txt');
    // When
    const error = await moveWithoutOverwrite(props);
    // Then
    expect(error?.code).toBe('SOURCE_NOT_FOUND');
    await expect(readdir(folder)).resolves.toStrictEqual(['source.txt']);
  });
});
