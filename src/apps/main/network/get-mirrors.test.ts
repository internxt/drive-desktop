import { partialSpyOn, mockProps } from '@/tests/vitest/utils.helper.test';
import { getMirrors } from './get-mirrors';
import * as getFileMirrorsModule from './get-file-mirrors';
import * as replaceMirrorModule from './replace-mirror';

const baseFarmer = {
  userAgent: 'ua',
  protocol: 'http',
  address: 'address',
  port: 1,
  nodeID: 'nodeID',
  lastSeen: new Date(),
};

const mockMirror = {
  farmer: baseFarmer,
  hash: 'hash1',
  index: 0,
  replaceCount: 0,
  size: 1,
  parity: false,
  token: '',
  url: 'url',
  operation: '',
};

describe('getMirrors', () => {
  const props = mockProps<typeof getMirrors>({});
  const getFileMirrorsMock = partialSpyOn(getFileMirrorsModule, 'getFileMirrors');
  const replaceMirrorMock = partialSpyOn(replaceMirrorModule, 'replaceMirror');

  it('should fetch and return mirrors with healthy farmers', async () => {
    getFileMirrorsMock.mockResolvedValueOnce([mockMirror]).mockResolvedValue([]);

    const result = await getMirrors(props);

    expect(getFileMirrorsMock).toHaveBeenCalledTimes(2);
    expect(replaceMirrorMock).not.toHaveBeenCalled();
    expect(result).toEqual([mockMirror]);
  });

  it('should replace mirror if farmer is not ok', async () => {
    const unhealthyMirror = { ...mockMirror, farmer: {} };
    getFileMirrorsMock.mockResolvedValueOnce([unhealthyMirror]).mockResolvedValueOnce([mockMirror]).mockResolvedValue([]);
    replaceMirrorMock.mockResolvedValue(mockMirror);

    const result = await getMirrors(props);

    expect(getFileMirrorsMock).toHaveBeenCalledTimes(3);
    expect(replaceMirrorMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([mockMirror, mockMirror]);
  });

  it('should throw if replaced mirror is still not ok', async () => {
    const unhealthyMirror = { ...mockMirror, farmer: {} };
    getFileMirrorsMock.mockResolvedValueOnce([unhealthyMirror]).mockResolvedValueOnce([unhealthyMirror]).mockResolvedValue([]);
    replaceMirrorMock.mockResolvedValue(unhealthyMirror);

    await expect(getMirrors(props)).rejects.toThrow(/Missing pointer for shard/);
    expect(getFileMirrorsMock).toHaveBeenCalledTimes(3);
    expect(replaceMirrorMock).toHaveBeenCalledTimes(1);
  });

  it('should throw if replaced mirror has no url', async () => {
    const unhealthyMirror = { ...mockMirror, farmer: {} };
    const noUrlMirror = { ...mockMirror, url: '', farmer: baseFarmer };
    const getFileMirrorsMock = partialSpyOn(getFileMirrorsModule, 'getFileMirrors');
    const replaceMirrorMock = partialSpyOn(replaceMirrorModule, 'replaceMirror');
    getFileMirrorsMock.mockResolvedValueOnce([unhealthyMirror]).mockResolvedValueOnce([noUrlMirror]).mockResolvedValue([]);
    replaceMirrorMock.mockResolvedValue(noUrlMirror);

    await expect(getMirrors(props)).rejects.toThrow(/Missing download url for shard/);
    expect(getFileMirrorsMock).toHaveBeenCalledTimes(3);
    expect(replaceMirrorMock).toHaveBeenCalledTimes(1);
  });
});
