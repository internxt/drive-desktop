import { mapStatusToErrorCause } from './drive-server.error';

describe('mapStatusToErrorCause', () => {
  it('maps 402 to FILE_TOO_BIG', () => {
    expect(mapStatusToErrorCause(402)).toBe('FILE_TOO_BIG');
  });
});
