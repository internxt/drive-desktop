import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { loggerFn } from '@/tests/vitest/mocks.helper.test';
import { call, calls, deepMocked, TestProps } from '@/tests/vitest/utils.helper.test';
import { verifyHash } from './verify-hash';

vi.mock(import('node:fs/promises'));

describe('verify-hash', () => {
  const readFileMock = deepMocked(readFile);

  const fileContent = Buffer.from('fake installer content');
  const validHash = createHash('sha512').update(fileContent).digest('base64');
  const wrongHash = createHash('sha512').update(Buffer.from('wrong content')).digest('base64');
  const props: TestProps<typeof verifyHash> = {};

  function latestYml(hash: string) {
    return `
version: 10.0.0
files:
  - url: Internxt-Setup-10.0.0.exe
    sha512: ${hash}
    size: 321837779
path: Internxt-Setup-10.0.0.exe
sha512: ${hash}
releaseDate: '2026-04-23T09:59:15.387Z'`;
  }

  beforeEach(() => {
    readFileMock.mockResolvedValue(fileContent);
  });

  it('should verify hash successfully when hashes match', async () => {
    // Given
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(latestYml(validHash)) }));
    // When
    await verifyHash(props as any);
    // Then
    call(fetch).toBe('https://github.com/internxt/drive-desktop/releases/latest/download/latest.yml');
    calls(loggerFn).toMatchObject([{ msg: 'Verifying release hash' }, { msg: 'Release hash verified' }]);
  });

  it('should throw if sha512 not found in latest.yml', async () => {
    // Given
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue('invalid') }));
    // When
    const promise = verifyHash(props as any);
    // Then
    await expect(promise).rejects.toThrow('sha512 not found in latest.yml');
  });

  it('should throw if hash mismatch', async () => {
    // Given
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(latestYml(wrongHash)) }));
    // When
    const promise = verifyHash(props as any);
    // Then
    await expect(promise).rejects.toThrow(`sha512 mismatch: expected ${wrongHash}, got ${validHash}`);
  });
});
