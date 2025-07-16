import * as sleep from '@/apps/main/util';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';
import { untilIsNotBusy } from './until-is-not-busy';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createWriteStream } from 'fs';

describe('until-is-not-busy', () => {
  partialSpyOn(sleep, 'sleep');

  const folder = join(TEST_FILES, v4());

  beforeAll(async () => {
    await mkdir(folder);
  });

  afterAll(async () => {
    await rm(folder, { recursive: true });
  });

  it('should not throw an error if file is not busy', async () => {
    // Given
    const absolutePath = join(folder, v4()) as AbsolutePath;
    await writeFile(absolutePath, 'content');
    // When
    await untilIsNotBusy({ absolutePath });
  });

  it('should throw an error is read stream ends', async () => {
    // Given
    const absolutePath = join(folder, v4()) as AbsolutePath;
    await writeFile(absolutePath, 'content');
    const stream = createWriteStream(absolutePath);
    // When
    const promise = untilIsNotBusy({ absolutePath });
    // Then
    await expect(promise).rejects.toThrow('File is still busy after 5 retries: end');
    stream.close();
  });
});
