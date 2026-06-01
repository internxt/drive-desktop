import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { openController } from './open.controller';
import * as openServiceModule from '../../services/operations/open.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('openController', () => {
  const openMock = partialSpyOn(openServiceModule, 'open');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 when file is opened successfully', async () => {
    req.body = { path: '/some/file.txt', flags: 0, processName: 'cat' };
    openMock.mockResolvedValue({ data: undefined });

    await openController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: 0 });
  });

  it('should return errno ENOENT when file is not found', async () => {
    req.body = { path: '/missing.txt', flags: 0, processName: 'cat' };
    openMock.mockResolvedValue({ error: new FuseError(FuseCodes.ENOENT, 'File not found') });

    await openController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.ENOENT });
  });

  it('should return errno EEXIST when path is an auxiliary file conflict', async () => {
    req.body = { path: '/some/.tmp', flags: 0, processName: 'cat' };
    openMock.mockResolvedValue({ error: new FuseError(FuseCodes.EEXIST, 'Conflict') });

    await openController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.EEXIST });
  });
});
