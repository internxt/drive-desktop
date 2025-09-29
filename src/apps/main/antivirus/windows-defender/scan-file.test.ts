import { scanFile } from './scan-file';
import * as childProcess from 'node:child_process';
import { EventEmitter } from 'events';
import { deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as parseVirusNames from './parse-virus-names';

type MockChildProcess = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  on(event: string, listener: (...args: unknown[]) => void): MockChildProcess;
  emit(event: string, ...args: unknown[]): boolean;
};

vi.mock(import('child_process'));

describe('scanFile', () => {
  partialSpyOn(console, 'error');
  const parseVirusNamesMock = partialSpyOn(parseVirusNames, 'parseVirusNames');
  const spawnMock = deepMocked(childProcess.spawn);

  beforeEach(() => {
    parseVirusNamesMock.mockImplementation(({ stdout }) => {
      if (stdout.includes('TestVirus')) return ['TestVirus'];
      return ['Windows.Defender.Threat.Detected'];
    });
  });

  it('returns clean scan result when file is not infected', async () => {
    // Given
    const filePath = 'C:\\path\\to\\clean\\file.txt';
    const mpCmdRunPath = 'C:\\path\\to\\MpCmdRun.exe';
    const mockProcess = createMockChildProcessImmediate(0, 'File scan completed.', '');
    spawnMock.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess);
    // When
    const result = await scanFile({ filePath, mpCmdRunPath });
    // Then
    expect(spawnMock).toBeCalledWith(mpCmdRunPath, ['-Scan', '-ScanType', '3', '-File', filePath, '-DisableRemediation']);
    expect(result).toEqual({
      file: filePath,
      isInfected: false,
      viruses: [],
    });
  });

  it('returns infected scan result when file is infected', async () => {
    // Given
    const filePath = 'C:\\path\\to\\infected\\file.txt';
    const mpCmdRunPath = 'C:\\path\\to\\MpCmdRun.exe';
    const mockProcess = createMockChildProcessImmediate(2, 'Found TestVirus threat', '');
    spawnMock.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess);
    // When
    const result = await scanFile({ filePath, mpCmdRunPath });
    // Then
    expect(spawnMock).toBeCalledWith(mpCmdRunPath, ['-Scan', '-ScanType', '3', '-File', filePath, '-DisableRemediation']);
    expect(result).toEqual({
      file: filePath,
      isInfected: true,
      viruses: ['TestVirus'],
    });
  });

  it('handles stderr output', async () => {
    // Given
    const filePath = 'C:\\path\\to\\file.txt';
    const mpCmdRunPath = 'C:\\path\\to\\MpCmdRun.exe';
    const mockProcess = createMockChildProcessImmediate(2, '', 'Error: Malware detected');
    spawnMock.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess);
    // When
    const result = await scanFile({ filePath, mpCmdRunPath });
    // Then
    expect(result.isInfected).toBe(true);
    expect(result.viruses.length).toBeGreaterThan(0);
  });
});

function createMockChildProcessImmediate(exitCode: number, stdout: string, stderr: string): MockChildProcess {
  const mockProcess = new EventEmitter() as MockChildProcess;
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();

  process.nextTick(() => {
    if (stdout) mockProcess.stdout.emit('data', stdout);
    if (stderr) mockProcess.stderr.emit('data', stderr);
    mockProcess.emit('close', exitCode);
  });

  return mockProcess;
}
