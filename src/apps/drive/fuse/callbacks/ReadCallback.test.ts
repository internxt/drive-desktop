// import Fuse from '@gcas/fuse';
// import { ReadCallback } from './ReadCallback';
// import * as handleReadModule from '../../../../backend/features/fuse/on-read/handle-read-callback';
// import { partialSpyOn } from '../../../../../tests/vitest/utils.helper';
// import { left, right } from '../../../../context/shared/domain/Either';
// import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';
// import { type Container } from 'diod';

// const handleReadCallbackMock = partialSpyOn(handleReadModule, 'handleReadCallback');

// function createMockContainer() {
//   return {
//     get: vi.fn().mockReturnValue({
//       run: vi.fn(),
//       exists: vi.fn(),
//       register: vi.fn(),
//       downloadStarted: vi.fn(),
//       downloadUpdate: vi.fn(),
//       downloadFinished: vi.fn(),
//       elapsedTime: vi.fn(),
//     }),
//   } as Partial<Container> as Container;
// }

describe.skip('ReadCallback', () => {
  //   it('should copy chunk into buf and call cb with chunk length on success', async () => {
  //     const chunk = Buffer.from('hello');
  //     handleReadCallbackMock.mockResolvedValue(right(chunk));
  //     const buf = Buffer.alloc(10);
  //     const cb = vi.fn();
  //     const callback = new ReadCallback(createMockContainer());
  //     await callback.execute('/file.txt', 0, buf, 5, 0, cb);
  //     expect(buf.subarray(0, 5).toString()).toBe('hello');
  //     expect(cb).toHaveBeenCalledWith(5);
  //   });
  //   it('should call cb with error code when result is left', async () => {
  //     const error = new FuseNoSuchFileOrDirectoryError('/file.txt');
  //     handleReadCallbackMock.mockResolvedValue(left(error));
  //     const cb = vi.fn();
  //     const callback = new ReadCallback(createMockContainer());
  //     await callback.execute('/file.txt', 0, Buffer.alloc(10), 10, 0, cb);
  //     expect(cb).toHaveBeenCalledWith(error.code);
  //   });
  //   it('should call cb with Fuse.EIO when an exception is thrown', async () => {
  //     handleReadCallbackMock.mockRejectedValue(new Error('unexpected'));
  //     const cb = vi.fn();
  //     const callback = new ReadCallback(createMockContainer());
  //     await callback.execute('/file.txt', 0, Buffer.alloc(10), 10, 0, cb);
  //     expect(cb).toHaveBeenCalledWith(Fuse.EIO);
  //   });
  //   it('should call cb with 0 when result is an empty buffer', async () => {
  //     handleReadCallbackMock.mockResolvedValue(right(Buffer.alloc(0)));
  //     const cb = vi.fn();
  //     const callback = new ReadCallback(createMockContainer());
  //     await callback.execute('/file.txt', 0, Buffer.alloc(10), 10, 0, cb);
  //     expect(cb).toHaveBeenCalledWith(0);
  //   });
});
