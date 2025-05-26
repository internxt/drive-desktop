import { cwd } from 'process';
import { stat } from './stat';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { execSync } from 'child_process';

describe('stat', () => {
  it('If file exists', async () => {
    // When
    const { data } = await stat({ absolutePath: join(cwd(), 'package.json') });

    // Then
    expect(data).toBeTruthy();
  });

  it('If file does not exist (ENOENT)', async () => {
    // When
    const { error } = await stat({ absolutePath: 'not_existing_file' });

    // Then
    expect(error?.cause).toEqual('NON_EXISTS');
  });

  it('If file access is denied (EPERM)', async () => {
    // Given
    const folder = join(TEST_FILES, v4());
    const file = join(folder, 'file.txt');

    await mkdir(folder);
    await writeFile(file, 'content');

    execSync(`icacls "${file}" /deny "${process.env.USERNAME}":F`);

    // When
    const { error } = await stat({ absolutePath: file });

    // Then
    expect(error?.cause).toEqual('NO_ACCESS');
  });
});
