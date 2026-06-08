import { randomUUID } from 'node:crypto';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { registerSyncRoot, RegisterSyncRootError } from './register-sync-root';

describe('register-sync-root', () => {
  const providerId = randomUUID();
  const providerName = 'Internxt Drive';
  const testPath = join(TEST_FILES, randomUUID());
  const rootPath = join(testPath, randomUUID());

  beforeAll(async () => {
    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should return error if path is too short', async () => {
    // Given
    const props = mockProps<typeof registerSyncRoot>({ ctx: { rootPath: abs('/'), providerName, providerId: randomUUID() } });
    // When
    const error = await registerSyncRoot(props);
    // Then
    expect(error).toBeInstanceOf(RegisterSyncRootError);
    expect(error).toMatchObject({
      code: 'UNKNOWN',
      cause: expect.stringContaining('HRESULT: 0x80070057'),
    });
  });

  it('should return error if path is registered with a different provider id', async () => {
    // Given
    const props = mockProps<typeof registerSyncRoot>({ ctx: { rootPath, providerName, providerId: randomUUID() } });
    // When
    const error = await registerSyncRoot(props);
    // Then
    expect(error).toBeInstanceOf(RegisterSyncRootError);
    expect(error).toMatchObject({
      code: 'ACCESS_DENIED',
      cause: expect.stringContaining('HRESULT: 0x80070005'),
    });
  });
});
