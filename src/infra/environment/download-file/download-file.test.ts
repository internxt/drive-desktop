import { Readable } from 'node:stream';
import axios from 'axios';
import { downloadFile as sdkDownloadFile } from '@internxt/sdk/dist/network/download';
import { decryptAtOffset } from './decrypt-at-offset';
import { downloadFileRange } from './download-file';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@internxt/sdk/dist/network/download', () => ({
  downloadFile: vi.fn(),
}));

vi.mock('./build-crypto-lib', () => ({
  buildCryptoLib: vi.fn(() => ({})),
}));

vi.mock('./decrypt-at-offset', () => ({
  decryptAtOffset: vi.fn(),
}));

const axiosGetMock = vi.mocked(axios.get);
const sdkDownloadFileMock = vi.mocked(sdkDownloadFile);
const decryptAtOffsetMock = vi.mocked(decryptAtOffset);

describe('downloadFileRange', () => {
  beforeEach(() => {
    axiosGetMock.mockResolvedValue({
      data: Readable.from([Buffer.from('encrypted')]),
    });
    decryptAtOffsetMock.mockReturnValue(Buffer.from('decrypted'));
    sdkDownloadFileMock.mockImplementation(async (...args) => {
      const downloadFileCb = args[6];
      const decryptFileCb = args[7];

      await downloadFileCb([{ url: 'https://download.test/file' }] as never, 9);
      await decryptFileCb(
        undefined as never,
        Buffer.from('keykeykeykeykeykeykeykeykeykey12'),
        Buffer.from('iviviviviviviviv'),
        9,
      );
    });
  });

  it('passes the abort signal to the HTTP range request', async () => {
    const abortController = new AbortController();

    const result = await downloadFileRange({
      fileId: 'file-id',
      bucketId: 'bucket-id',
      mnemonic: 'mnemonic',
      network: {} as never,
      range: { position: 10, length: 20 },
      signal: abortController.signal,
    });

    expect(result.data).toStrictEqual(Buffer.from('decrypted'));
    expect(axiosGetMock).toHaveBeenCalledWith('https://download.test/file', {
      responseType: 'stream',
      signal: abortController.signal,
      headers: {
        range: 'bytes=10-29',
      },
    });
  });
});
