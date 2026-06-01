import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { readController } from './read.controller';
import * as readServiceModule from '../../services/operations/read.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('readController', () => {
  const readMock = partialSpyOn(readServiceModule, 'read');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
    res.set.mockReturnValue(res);
  });

  it('should send buffer and X-Errno 0 on success', async () => {
    const chunk = Buffer.from('file data');
    req.body = { path: '/file.mp4', length: 10, offset: 0, processName: 'vlc' };
    readMock.mockResolvedValue({ data: chunk });

    await readController(req, res, container);

    expect(res.set).toHaveBeenCalledWith('X-Errno', '0');
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    expect(res.send).toHaveBeenCalledWith(chunk);
  });

  it('should send X-Errno with error code and empty buffer on error', async () => {
    req.body = { path: '/file.mp4', length: 10, offset: 0, processName: 'vlc' };
    readMock.mockResolvedValue({ error: new FuseError(FuseCodes.ENOENT, 'not found') });

    await readController(req, res, container);

    expect(res.set).toHaveBeenCalledWith('X-Errno', String(FuseCodes.ENOENT));
    expect(res.send).toHaveBeenCalledWith(Buffer.alloc(0));
  });

  it('should send EINVAL and empty buffer when required fields are missing', async () => {
    req.body = { path: '/file.mp4' };

    await readController(req, res, container);

    expect(res.set).toHaveBeenCalledWith('X-Errno', String(FuseCodes.EINVAL));
    expect(res.send).toHaveBeenCalledWith(Buffer.alloc(0));
    expect(readMock).not.toHaveBeenCalled();
  });

  it('should normalize path by adding leading slash', async () => {
    req.body = { path: 'file.mp4', length: 10, offset: 0, processName: 'vlc' };
    readMock.mockResolvedValue({ data: Buffer.alloc(0) });

    await readController(req, res, container);

    expect(readMock).toHaveBeenCalledWith('/file.mp4', 10, 0, 'vlc', container);
  });

  it('should default processName to empty string when not a string', async () => {
    req.body = { path: '/file.mp4', length: 10, offset: 0, processName: 123 };
    readMock.mockResolvedValue({ data: Buffer.alloc(0) });

    await readController(req, res, container);

    expect(readMock).toHaveBeenCalledWith('/file.mp4', 10, 0, '', container);
  });
});
