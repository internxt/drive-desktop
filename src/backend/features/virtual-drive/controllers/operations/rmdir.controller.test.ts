import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { rmdirController } from './rmdir.controller';
import * as rmdirServiceModule from '../../services/operations/rmdir.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

vi.mock('@internxt/drive-desktop-core/build/backend');
vi.mock('../../services/operations/rmdir.service');

describe('rmdirController', () => {
  const rmdirMock = partialSpyOn(rmdirServiceModule, 'rmdir');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 when rmdir succeeds', async () => {
    req.body = { path: '/some/folder' };
    rmdirMock.mockResolvedValue({ data: undefined });

    await rmdirController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: 0 });
  });

  it('should return errno ENOENT when rmdir returns ENOENT', async () => {
    req.body = { path: '/missing/folder' };
    rmdirMock.mockResolvedValue({ error: new FuseError(FuseCodes.ENOENT, 'not found') });

    await rmdirController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.ENOENT });
  });

  it('should return errno EIO when rmdir returns non-ENOENT error', async () => {
    req.body = { path: '/some/folder' };
    rmdirMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'io error') });

    await rmdirController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.EIO });
  });
});
