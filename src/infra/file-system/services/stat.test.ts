import { cwd } from 'node:process';
import { stat } from './stat';
import { join } from 'node:path';

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
    expect(error?.code).toEqual('NON_EXISTS');
  });
});
