import { describe, expect, it, vi } from 'vitest';
import { scanFile } from './scan-file';
import * as childProcess from 'child_process';
import { EventEmitter } from 'events';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { parseVirusNames } from './parse-virus-names';

// Definimos una interfaz para el proceso simulado
interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  on(event: string, listener: (...args: unknown[]) => void): this;
  emit(event: string, ...args: unknown[]): boolean;
}

// Mock modules
vi.mock(import('child_process'));
vi.mock(import('./parse-virus-names'));

const spawnMock = deepMocked(childProcess.spawn);
const parseVirusNamesMock = deepMocked(parseVirusNames);

describe('scanFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseVirusNamesMock.mockImplementation(({ stdout, stderr }) => {
      if (stdout.includes('TestVirus')) return ['TestVirus'];
      return ['Windows.Defender.Threat.Detected'];
    });
  });

  it('returns clean scan result when file is not infected', async () => {
    // Given
    const filePath = 'C:\\path\\to\\clean\\file.txt';
    const mpCmdRunPath = 'C:\\path\\to\\MpCmdRun.exe';

    const mockProcess = createMockChildProcess(0, 'File scan completed.', '');
    spawnMock.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess);

    // When
    const result = await scanFile(filePath, mpCmdRunPath);

    // Then
    expect(spawnMock).toHaveBeenCalledWith(mpCmdRunPath, ['-Scan', '-ScanType', '3', '-File', filePath]);
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

    const mockProcess = createMockChildProcess(2, 'Found TestVirus threat', '');
    spawnMock.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess);

    // When
    const result = await scanFile(filePath, mpCmdRunPath);

    // Then
    expect(spawnMock).toHaveBeenCalledWith(mpCmdRunPath, ['-Scan', '-ScanType', '3', '-File', filePath]);
    expect(result).toEqual({
      file: filePath,
      isInfected: true,
      viruses: ['TestVirus'],
    });
  });

  it('handles spawn errors properly', async () => {
    // Given
    const filePath = 'C:\\path\\to\\file.txt';
    const mpCmdRunPath = 'C:\\path\\to\\MpCmdRun.exe';

    const mockProcess = new EventEmitter() as MockChildProcess;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    spawnMock.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess);

    // Mock console.error to prevent test output noise
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // When - Execute the function that will handle the error
    const resultPromise = scanFile(filePath, mpCmdRunPath);

    // Emit the error immediately instead of using setTimeout
    mockProcess.emit('error', new Error('Spawn failed'));

    // Emit close to resolve the promise
    mockProcess.emit('close', 0);

    // Then
    const result = await resultPromise;
    expect(result.isInfected).toBe(false);

    // Clean up
    consoleErrorSpy.mockRestore();
  });

  it('handles stderr output', async () => {
    // Given
    const filePath = 'C:\\path\\to\\file.txt';
    const mpCmdRunPath = 'C:\\path\\to\\MpCmdRun.exe';

    const mockProcess = createMockChildProcess(2, '', 'Error: Malware detected');
    spawnMock.mockReturnValue(mockProcess as unknown as childProcess.ChildProcess);

    // When
    const result = await scanFile(filePath, mpCmdRunPath);

    // Then
    expect(result.isInfected).toBe(true);
    expect(result.viruses.length).toBeGreaterThan(0);
  });
});

function createMockChildProcess(exitCode: number, stdout: string, stderr: string): MockChildProcess {
  const stdoutEmitter = new EventEmitter();
  const stderrEmitter = new EventEmitter();
  const mockProcess = new EventEmitter() as MockChildProcess;

  mockProcess.stdout = stdoutEmitter;
  mockProcess.stderr = stderrEmitter;

  // Schedule events to simulate the asynchronous process
  setTimeout(() => {
    if (stdout) stdoutEmitter.emit('data', stdout);
    if (stderr) stderrEmitter.emit('data', stderr);
    mockProcess.emit('close', exitCode);
  }, 10);

  return mockProcess;
}
