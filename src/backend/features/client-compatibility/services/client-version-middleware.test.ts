import * as core from '@internxt/drive-desktop-core/build/backend';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as stateModule from './client-compatibility-state';
import { detectUnsupportedClientVersion, rejectRequestIfClientUnsupported } from './client-version-middleware';

describe('client-version-middleware', () => {
  const isClientUnsupportedMock = partialSpyOn(stateModule, 'isClientUnsupported');
  const setClientCompatibilityMock = partialSpyOn(stateModule, 'setClientCompatibility');
  const isUnsupportedVersionErrorMock = partialSpyOn(core, 'isUnsupportedVersionError');

  beforeEach(() => {
    isClientUnsupportedMock.mockReturnValue(false);
  });

  describe('rejectRequestIfClientUnsupported', () => {
    it('should let the request through when the client is supported', () => {
      // When
      const res = rejectRequestIfClientUnsupported();
      // Then
      expect(res).toBeUndefined();
    });

    it('should answer locally with the unsupported version error when the client is unsupported', async () => {
      // Given
      isClientUnsupportedMock.mockReturnValue(true);
      // When
      const res = rejectRequestIfClientUnsupported();
      // Then
      expect(res?.status).toBe(403);
      expect(await res?.json()).toMatchObject({ errorCode: 'CLIENT_VERSION_UNSUPPORTED' });
    });
  });

  describe('detectUnsupportedClientVersion', () => {
    const body = { statusCode: 403, errorCode: 'CLIENT_VERSION_UNSUPPORTED', recommendedVersion: '2.8.1' };

    it('should ignore successful responses', async () => {
      // When
      await detectUnsupportedClientVersion({ response: Response.json(body) });
      // Then
      expect(isUnsupportedVersionErrorMock).not.toHaveBeenCalled();
    });

    it('should mark the client as unsupported when the error code says so', async () => {
      // Given
      isUnsupportedVersionErrorMock.mockReturnValue(true);
      // When
      await detectUnsupportedClientVersion({ response: Response.json(body, { status: 403 }) });
      // Then
      expect(isUnsupportedVersionErrorMock).toHaveBeenCalledWith({ body });
      expect(setClientCompatibilityMock).toHaveBeenCalledWith({ state: { status: 'unsupported', recommendedVersion: '2.8.1' } });
    });

    it('should not mark the client as unsupported for other 403 errors', async () => {
      // Given
      isUnsupportedVersionErrorMock.mockReturnValue(false);
      // When
      await detectUnsupportedClientVersion({ response: Response.json({ statusCode: 403 }, { status: 403 }) });
      // Then
      expect(setClientCompatibilityMock).not.toHaveBeenCalled();
    });

    it('should ignore error bodies that are not JSON', async () => {
      // When
      await detectUnsupportedClientVersion({ response: new Response('Bad gateway', { status: 502 }) });
      // Then
      expect(setClientCompatibilityMock).not.toHaveBeenCalled();
    });

    it('should leave the response body readable for the caller', async () => {
      // Given
      const response = Response.json(body, { status: 403 });
      // When
      await detectUnsupportedClientVersion({ response });
      // Then
      expect(await response.json()).toStrictEqual(body);
    });
  });
});
