import { cwd } from 'process';
import { stat } from './stat';
import { join } from 'path';

describe('stat', () => {
  it('If file exists', async () => {
    // When
    const res = await stat({ absolutePath: join(cwd(), 'package.json') });

    // Then
    expect(res.isRight()).toBeTruthy();
  });

  it('If file does not exist', async () => {
    // When
    const res = await stat({ absolutePath: 'not_existing_file' });

    // Then
    expect(res.getLeft().cause).toEqual('NON_EXISTS');
  });
});
