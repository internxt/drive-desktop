import { join } from 'node:path';
import { cwd } from 'node:process';
import { access } from './access';

describe('access', () => {
  it('should return undefined if file exists', async () => {
    // When
    const error = await access(join(cwd(), 'package.json'));
    // Then
    expect(error).toBeUndefined();
  });

  it('should return NON_EXISTS if file does not exist', async () => {
    // When
    const error = await access('not_existing_file');
    // Then
    expect(error).toMatchObject({ code: 'NON_EXISTS', cause: { code: 'ENOENT' } });
  });

  it('should return UNKNOWN if it throws an unknown error', async () => {
    // When
    const error = await access({} as any);
    // Then
    expect(error).toMatchObject({ code: 'UNKNOWN', cause: { code: 'ERR_INVALID_ARG_TYPE' } });
  });
});
