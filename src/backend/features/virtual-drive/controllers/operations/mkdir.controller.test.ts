import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { mkdirController } from './mkdir.controller';
import * as mkdirServiceModule from '../../services/operations/mkdir.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('mkdirController', () => {
  const mkdirMock = partialSpyOn(mkdirServiceModule, 'mkdir');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 when folder is created successfully', async () => {
    req.body = { path: '/Documents/NewFolder' };
    mkdirMock.mockResolvedValue({ data: undefined });

    await mkdirController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: 0 });
  });

  it('should return errno EIO when folder creation fails', async () => {
    req.body = { path: '/Documents/NewFolder' };
    mkdirMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'io error') });

    await mkdirController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.EIO });
  });
});
