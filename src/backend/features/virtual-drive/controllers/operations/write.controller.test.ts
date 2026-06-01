import { mockDeep } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Container } from 'diod';
import { writeController } from './write.controller';
import * as writeServiceModule from '../../services/operations/write.service';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';

describe('writeController', () => {
  const writeMock = partialSpyOn(writeServiceModule, 'write');
  let req: ReturnType<typeof mockDeep<Request>>;
  let res: ReturnType<typeof mockDeep<Response>>;
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    req = mockDeep<Request>();
    res = mockDeep<Response>();
    container = mockDeep<Container>();
    res.set.mockReturnValue(res);
  });

  it('should return errno EINVAL when payload is invalid', async () => {
    req.header.calledWith('X-Path-B64').mockReturnValue(Buffer.from('/some/file.txt', 'utf8').toString('base64'));
    req.header.calledWith('X-Offset').mockReturnValue('wrong');
    req.body = Buffer.from('hello');

    await writeController(req, res, container);

    expect(res.set).toHaveBeenCalledWith('X-Errno', String(FuseCodes.EINVAL));
    expect(res.send).toHaveBeenCalledWith(Buffer.alloc(0));
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('should return errno 0 and written bytes when write succeeds', async () => {
    req.header.calledWith('X-Path-B64').mockReturnValue(Buffer.from('/some/file.txt', 'utf8').toString('base64'));
    req.header.calledWith('X-Offset').mockReturnValue('0');
    req.body = Buffer.from('hello');
    writeMock.mockResolvedValue({ data: 5 });

    await writeController(req, res, container);

    expect(res.set).toHaveBeenCalledWith('X-Errno', '0');
    expect(res.set).toHaveBeenCalledWith('X-Written', '5');
    expect(res.send).toHaveBeenCalledWith(Buffer.alloc(0));
  });

  it('should return errno EIO when write fails', async () => {
    req.header.calledWith('X-Path-B64').mockReturnValue(Buffer.from('/some/file.txt', 'utf8').toString('base64'));
    req.header.calledWith('X-Offset').mockReturnValue('0');
    req.body = Buffer.from('hello');
    writeMock.mockResolvedValue({ error: new FuseError(FuseCodes.EIO, 'io error') });

    await writeController(req, res, container);

    expect(res.set).toHaveBeenCalledWith('X-Errno', String(FuseCodes.EIO));
    expect(res.send).toHaveBeenCalledWith(Buffer.alloc(0));
  });

  it('should decode UTF-8 path from base64 header before write', async () => {
    const encodedPath = Buffer.from('/тестовое изображение.jpeg', 'utf8').toString('base64');
    req.header.calledWith('X-Path-B64').mockReturnValue(encodedPath);
    req.header.calledWith('X-Offset').mockReturnValue('0');
    req.body = Buffer.from('hello');
    writeMock.mockResolvedValue({ data: 5 });

    await writeController(req, res, container);

    expect(writeMock).toHaveBeenCalledWith({
      path: '/тестовое изображение.jpeg',
      content: Buffer.from('hello'),
      offset: 0,
      container,
    });
  });

  it('should decode base64 path from header when filename contains newline', async () => {
    const newlinePath = '/nombre\narchivo.txt';
    const encodedPath = Buffer.from(newlinePath, 'utf8').toString('base64');
    req.header.calledWith('X-Path-B64').mockReturnValue(encodedPath);
    req.header.calledWith('X-Offset').mockReturnValue('0');
    req.body = Buffer.from('hello');
    writeMock.mockResolvedValue({ data: 5 });

    await writeController(req, res, container);

    expect(writeMock).toHaveBeenCalledWith({
      path: newlinePath,
      content: Buffer.from('hello'),
      offset: 0,
      container,
    });
  });
});
