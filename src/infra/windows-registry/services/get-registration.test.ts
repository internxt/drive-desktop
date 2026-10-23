import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getRegistration } from './get-registration';
import * as registry from './registry';

describe('get-registration', () => {
  const queryKeyMock = partialSpyOn(registry, 'queryKey');
  const id = '{79B4725E-9B4E-4726-B46D-1A202B28A6CF}';
  const namespaceClsid = '{CLSID}';
  const targetFolderPath = String.raw`C:\Users\user\InternxtDrive`;

  beforeEach(() => {
    queryKeyMock.mockImplementation(({ key }) => {
      if (key === `${registry.SYNC_ROOT_MANAGER_KEY}\\${id}`) {
        return Promise.resolve({
          values: { DisplayNameResource: 'Internxt Drive', NamespaceCLSID: namespaceClsid },
          subKeys: ['UserSyncRoots'],
        });
      }
      return Promise.resolve({ values: { TargetFolderPath: targetFolderPath }, subKeys: [] });
    });
  });

  it('should map a registration and its target folder path', async () => {
    // When
    const result = await getRegistration(id);
    // Then
    expect(result).toStrictEqual({
      data: { id, displayName: 'Internxt Drive', namespaceClsid, targetFolderPath, hasUserSyncRoots: true },
      error: undefined,
    });
    expect(queryKeyMock).toHaveBeenCalledWith({ key: `${registry.CLSID_KEY}\\${namespaceClsid}\\Instance\\InitPropertyBag` });
  });

  it('should default missing metadata without querying a missing CLSID', async () => {
    // Given
    queryKeyMock.mockResolvedValue({ values: {}, subKeys: [] });
    // When
    const result = await getRegistration(id);
    // Then
    expect(result).toStrictEqual({
      data: { id, displayName: '', namespaceClsid: '', targetFolderPath: '', hasUserSyncRoots: false },
      error: undefined,
    });
    expect(queryKeyMock).toHaveBeenCalledTimes(1);
  });

  it('should return a registry access error instead of throwing', async () => {
    // Given
    const error = new Error('ERROR: Access is denied.');
    queryKeyMock.mockRejectedValue(error);
    // When
    const result = await getRegistration(id);
    // Then
    expect(result).toStrictEqual({ data: undefined, error });
  });

  it('should normalize a non-Error rejection', async () => {
    // Given
    queryKeyMock.mockRejectedValue('Access denied');
    // When
    const result = await getRegistration(id);
    // Then
    expect(result.data).toBeUndefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.cause).toBe('Access denied');
  });

  it('should preserve registration metadata when its target folder cannot be read', async () => {
    // Given
    queryKeyMock.mockResolvedValueOnce({
      values: { DisplayNameResource: 'Internxt Drive', NamespaceCLSID: namespaceClsid },
      subKeys: ['UserSyncRoots'],
    });
    queryKeyMock.mockRejectedValueOnce(new Error('ERROR: Access is denied.'));
    // When
    const result = await getRegistration(id);
    // Then
    expect(result).toStrictEqual({
      data: { id, displayName: 'Internxt Drive', namespaceClsid, targetFolderPath: '', hasUserSyncRoots: true },
      error: undefined,
    });
  });
});
