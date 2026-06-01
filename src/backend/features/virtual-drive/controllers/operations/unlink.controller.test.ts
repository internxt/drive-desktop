import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { unlinkController } from './unlink.controller';
import * as unlinkServiceModule from '../../services/operations/unlink.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

vi.mock('@internxt/drive-desktop-core/build/backend');
vi.mock('../../services/operations/unlink.service');

describe('unlinkController', () => {
  const unlinkMock = partialSpyOn(unlinkServiceModule, 'unlink');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 when unlink succeeds', async () => {
    req.body = { path: '/some/file.txt' };
    unlinkMock.mockResolvedValue({ data: undefined });

    await unlinkController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: 0 });
  });

  it('should return errno ENOENT when unlink returns ENOENT', async () => {
    req.body = { path: '/missing.txt' };
    unlinkMock.mockResolvedValue({ error: new FuseError(FuseCodes.ENOENT, 'not found') });

    await unlinkController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.ENOENT });
  });

  it('should return errno EIO when unlink returns non-ENOENT error', async () => {
    req.body = { path: '/some/file.txt' };
    unlinkMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'io error') });

    await unlinkController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.EIO });
  });
});
