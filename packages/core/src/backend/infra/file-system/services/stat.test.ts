import fs from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { stat } from './stat';

describe('stat', () => {
  it('If file exists', async () => {
    // When
    const { data } = await stat({ absolutePath: join(cwd(), 'package.json') });
    // Then
    expect(data).toBeTruthy();
  });

  it('If file does not exist (ENOENT)', async () => {
    // When
    const { error } = await stat({ absolutePath: 'non_existing_file' });
    // Then
    expect(error?.code).toEqual('NON_EXISTS');
  });

  it('If file access is denied (EPERM)', async () => {
    // Given
    vi.spyOn(fs, 'stat').mockRejectedValueOnce(new Error('EPERM: operation not permitted'));
    // When
    const { error } = await stat({ absolutePath: 'restricted-file' });
    // Then
    expect(error?.code).toEqual('NO_ACCESS');
  });
});
