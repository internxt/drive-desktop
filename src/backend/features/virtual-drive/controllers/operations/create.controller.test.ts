import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { createController } from './create.controller';
import * as createServiceModule from '../../services/operations/create.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('createController', () => {
  const createMock = partialSpyOn(createServiceModule, 'create');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
  });

  it('should return errno 0 when file is created successfully', async () => {
    req.body = { path: '/some/file.txt' };
    createMock.mockResolvedValue({ data: undefined });

    await createController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: 0 });
  });

  it('should return errno EIO when create fails', async () => {
    req.body = { path: '/some/file.txt' };
    createMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'io error') });

    await createController(req, res, container);

    expect(res.json).toHaveBeenCalledWith({ errno: FuseCodes.EIO });
  });
});
