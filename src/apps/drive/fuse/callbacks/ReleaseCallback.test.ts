import { describe, it, vi } from 'vitest';
import { call } from '../../../../../tests/vitest/utils.helper';
import { ReleaseCallback } from './ReleaseCallback';
import { right } from '../../../../context/shared/domain/Either';
import * as openFlagsTracker from './../../../../backend/features/fuse/on-open/open-flags-tracker';
import * as handleReleaseModule from '../../../../backend/features/fuse/on-release/handle-release-callback';
import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
import { Container } from 'diod';

vi.mock(import('@internxt/drive-desktop-core/build/backend'));

describe('ReleaseCallback', () => {
  const onReleaseSpy = partialSpyOn(openFlagsTracker, 'onRelease');
  const handleReleaseSpy = partialSpyOn(handleReleaseModule, 'handleReleaseCallback');

  const container = { get: vi.fn() } as unknown as Container;
  const releaseCallback = new ReleaseCallback(container);
  it('should call onRelease to clean up open flags tracker', async () => {
    handleReleaseSpy.mockResolvedValue(right(undefined));

    await releaseCallback.execute('/Documents/file.pdf', 3);

    call(onReleaseSpy).toBe('/Documents/file.pdf');
  });

  it('should delegate to handleReleaseCallback', async () => {
    handleReleaseSpy.mockResolvedValue(right(undefined));

    await releaseCallback.execute('/Documents/file.pdf', 3);

    call(handleReleaseSpy).toMatchObject({ path: '/Documents/file.pdf' });
  });

  it('should return the result from handleReleaseCallback', async () => {
    handleReleaseSpy.mockResolvedValue(right(undefined));

    const result = await releaseCallback.execute('/Documents/file.pdf', 3);

    expect(result.isRight()).toBe(true);
  });
});
