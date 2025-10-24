import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as execAsyncModule from '@/core/utils/exec-async';
import { getMachineGuid } from './get-machine-guid';

describe('get-machine-guid', () => {
  const execAsyncMock = partialSpyOn(execAsyncModule, 'execAsync');
  const expectedGuid = '12345678-1234-1234-1234-123456789012';
  const command = `HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography\n    MachineGuid    REG_SZ    ${expectedGuid}\n`;

  beforeEach(() => {
    execAsyncMock.mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('should return machine GUID when registry query succeeds', async () => {
    execAsyncMock.mockResolvedValue({
      stdout: command,
      stderr: '',
    });
    const { data, error } = await getMachineGuid();
    expect(data).toBe(expectedGuid);
    expect(error).toBeUndefined();
  });

  it('should return NON_EXISTS error when output is empty', async () => {
    execAsyncMock.mockResolvedValue({
      stdout: '',
      stderr: '',
    });
    const { data, error } = await getMachineGuid();
    expect(error?.code).toBe('NON_EXISTS');
    expect(data).toBeUndefined();
  });

  it('should return UNKNOWN error when registry query fails', async () => {
    const execError = new Error('Registry access denied');
    execAsyncMock.mockRejectedValue(execError);
    const { data, error } = await getMachineGuid();
    expect(error?.code).toBe('UNKNOWN');
    expect(data).toBeUndefined();
  });
});
