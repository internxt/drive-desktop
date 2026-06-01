import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { releaseController } from './release.controller';
import * as releaseServiceModule from '../../services/operations/release.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

vi.mock(import('@internxt/drive-desktop-core/build/backend'));

describe('releaseController', () => {
  const releaseMock = partialSpyOn(releaseServiceModule, 'release');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 when release succeeds', async () => {
    req.body = { path: '/some/file.txt', processName: 'cat' };
    releaseMock.mockResolvedValue({ data: undefined });

    await releaseController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: 0 });
  });

  it('should return errno EIO when release fails', async () => {
    req.body = { path: '/some/file.txt', processName: 'cat' };
    releaseMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'Upload failed') });

    await releaseController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.EIO });
  });

  it('should normalize path by adding leading slash', async () => {
    req.body = { path: 'some/file.txt', processName: 'cat' };
    releaseMock.mockResolvedValue({ data: undefined });

    await releaseController(req, res, container);

    expect(releaseMock).toHaveBeenCalledWith(expect.objectContaining({ path: '/some/file.txt' }));
  });

  it('should forward processName to the service', async () => {
    req.body = { path: '/file.txt', processName: 'pool-org.gnome.' };
    releaseMock.mockResolvedValue({ data: undefined });

    await releaseController(req, res, container);

    expect(releaseMock).toHaveBeenCalledWith(expect.objectContaining({ processName: 'pool-org.gnome.' }));
  });

  it('should handle missing body fields gracefully', async () => {
    req.body = {};
    releaseMock.mockResolvedValue({ data: undefined });

    await releaseController(req, res, container);

    expect(releaseMock).toHaveBeenCalledWith(expect.objectContaining({ path: '/', processName: '' }));
    expect(res.json).toHaveBeenCalledWith({ errno: 0 });
  });
});
