import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AntivirusWindowsDefender } from './antivirus-windows-defender';
import { spawn } from 'child_process';
import { readdirSync, existsSync, statSync } from 'fs';
import { EventEmitter } from 'events';

// Mock dependencies
vi.mock('child_process');
vi.mock('fs');

describe('AntivirusWindowsDefender', () => {
  let mockProcess: EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    pid: number;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock child process
    mockProcess = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      pid: 12345,
    });

    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockProcess);

    // Mock file system functions
    (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(['4.18.2008.9-0', '4.18.2007.8-0']);
    (statSync as ReturnType<typeof vi.fn>).mockReturnValue({ isDirectory: () => true } as ReturnType<typeof statSync>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Adjust access to private properties and methods for testing
  describe('createInstance', () => {
    it('should create and initialize a new instance successfully', async () => {
      const instance = await AntivirusWindowsDefender.createInstance();

      // Assert
      expect(instance).toBeInstanceOf(AntivirusWindowsDefender);
      expect((instance as AntivirusWindowsDefender)['isInitialized']).toBe(true);
    });

    it('should throw error when MpCmdRun.exe is not found', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Act & Assert
      await expect(AntivirusWindowsDefender.createInstance()).rejects.toThrow('MpCmdRun.exe not found.');
    });
  });

  describe('initialize', () => {
    it('should initialize Windows Defender successfully', async () => {
      const instance = new AntivirusWindowsDefender();

      // Act
      await instance.initialize();

      // Assert
      expect((instance as AntivirusWindowsDefender)['isInitialized']).toBe(true);
      expect((instance as AntivirusWindowsDefender)['mpCmdRunPath']).toBeTruthy();
    });

    it('should handle initialization errors', async () => {
      (existsSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('File system error');
      });
      const instance = new AntivirusWindowsDefender();

      // Act & Assert
      await expect(instance.initialize()).rejects.toThrow('File system error');
    });
  });

  describe('findMpCmdRun', () => {
    it('should find MpCmdRun.exe in platform directory with latest version', () => {
      // Verifies that MpCmdRun.exe is found in the platform directory
      // with the latest version available.
      (existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        return path.includes('ProgramData') || path.includes('4.18.2008.9-0');
      });
      const instance = new AntivirusWindowsDefender();

      // Act
      const result = instance.findMpCmdRun();

      // Assert
      expect(result).toContain('4.18.2008.9-0');
      expect(result).toContain('MpCmdRun.exe');
    });

    it('should fallback to Program Files directory when platform directory not found', () => {
      // Ensures that the search for MpCmdRun.exe falls back to
      // the Program Files directory when the platform directory is not found.
      (existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        if (path.includes('ProgramData')) return false;
        if (path.includes('Program Files')) return true;
        return false;
      });
      const instance = new AntivirusWindowsDefender();

      // Act
      const result = instance.findMpCmdRun();

      // Assert
      expect(result).toBe('C:\\Program Files\\Windows Defender\\MpCmdRun.exe');
    });

    it('should throw error when MpCmdRun.exe is not found in any location', () => {
      // Ensures an error is thrown when MpCmdRun.exe is not found
      // in any of the expected locations.
      (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);
      const instance = new AntivirusWindowsDefender();

      // Act & Assert
      expect(() => instance.findMpCmdRun()).toThrow('MpCmdRun.exe not found.');
    });

    it('should sort versions correctly and pick the latest', () => {
      // Verifies that versions are sorted correctly and the latest
      // version is selected.
      (readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(['4.18.2007.8-0', '4.18.2008.9-0', '4.18.2006.7-0']);
      (existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
        return path.includes('ProgramData') || path.includes('4.18.2008.9-0');
      });
      const instance = new AntivirusWindowsDefender();

      // Act
      const result = instance.findMpCmdRun();

      // Assert
      expect(result).toContain('4.18.2008.9-0');
    });
  });

  describe('scanFile', () => {
    it('should scan file successfully with no threats detected', async () => {
      // Verifies that a file is scanned successfully with no threats detected.
      const instance = await AntivirusWindowsDefender.createInstance();
      const filePath = 'C:\\test\\file.txt';

      // Act
      const scanPromise = instance.scanFile(filePath);

      // Simulate process events
      mockProcess.stdout.emit('data', 'Scanning C:\\test\\file.txt...\n');
      mockProcess.stdout.emit('data', 'Scan completed successfully\n');
      mockProcess.emit('close', 0);

      const result = await scanPromise;

      // Assert
      expect(spawn).toHaveBeenCalledWith(expect.stringContaining('MpCmdRun.exe'), ['-Scan', '-ScanType', '3', '-File', filePath]);
      expect(result).toEqual({
        file: filePath,
        isInfected: false,
        viruses: [],
      });
    });

    it('should detect virus when exit code is 2', async () => {
      // Verifies that a virus is detected when the exit code is 2.
      const instance = await AntivirusWindowsDefender.createInstance();
      const filePath = 'C:\\test\\malware.exe';

      // Act
      const scanPromise = instance.scanFile(filePath);

      // Simulate virus detection
      mockProcess.stdout.emit('data', 'Threat detected: Trojan:Win32/Malware\n');
      mockProcess.emit('close', 2);

      const result = await scanPromise;

      // Assert
      expect(result).toEqual({
        file: filePath,
        isInfected: true,
        viruses: ['Trojan:Win32/Malware'],
      });
    });

    it('should parse multiple virus names from output', async () => {
      // Verifies that multiple virus names are parsed correctly
      // from the scan output.
      const instance = await AntivirusWindowsDefender.createInstance();
      const filePath = 'C:\\test\\malware.exe';

      // Act
      const scanPromise = instance.scanFile(filePath);

      // Simulate multiple threats
      mockProcess.stdout.emit('data', 'Threat detected: Trojan:Win32/Malware\n');
      mockProcess.stderr.emit('data', 'Found Adware:Win32/Suspicious threat\n');
      mockProcess.emit('close', 2);

      const result = await scanPromise;

      // Assert
      expect(result.isInfected).toBe(true);
      expect(result.viruses).toContain('Trojan:Win32/Malware');
      expect(result.viruses).toContain('Adware:Win32/Suspicious');
    });

    it('should handle scan errors gracefully', async () => {
      // Ensures that errors during the scan process are handled gracefully.
      const instance = await AntivirusWindowsDefender.createInstance();
      const filePath = 'C:\\test\\file.txt';

      // Act
      const scanPromise = instance.scanFile(filePath);

      // Simulate process error
      mockProcess.emit('error', new Error('Process failed'));

      // Assert
      await expect(scanPromise).rejects.toThrow('Process failed');
    });

    it('should throw error when not initialized', async () => {
      // Ensures an error is thrown when scanFile is called
      // without initializing Windows Defender.
      const instance = new AntivirusWindowsDefender();

      // Act & Assert
      await expect(instance.scanFile('C:\\test\\file.txt')).rejects.toThrow('Windows Defender is not initialized');
    });

    it('should use default virus name when no specific threats are parsed', async () => {
      // Verifies that a default virus name is used when no specific
      // threats are parsed from the scan output.
      const instance = await AntivirusWindowsDefender.createInstance();
      const filePath = 'C:\\test\\malware.exe';

      // Act
      const scanPromise = instance.scanFile(filePath);

      // Simulate virus detection without specific threat names
      mockProcess.stdout.emit('data', 'Malware detected but no specific name\n');
      mockProcess.emit('close', 2);

      const result = await scanPromise;

      // Assert
      expect(result.isInfected).toBe(true);
      expect(result.viruses).toContain('Windows.Defender.Threat.Detected');
    });
  });

  describe('parseVirusNames', () => {
    let instance: AntivirusWindowsDefender;

    beforeEach(async () => {
      instance = await AntivirusWindowsDefender.createInstance();
    });

    it('should return empty array when file is not infected', () => {
      // Verifies that an empty array is returned when the file is not infected.
      const stdout = 'Scan completed successfully';
      const stderr = '';

      // Act
      const result = (instance as AntivirusWindowsDefender)['parseVirusNames'](stdout, stderr, false);

      // Assert
      expect(result).toEqual([]);
    });

    it('should parse threat names using different patterns', () => {
      // Verifies that threat names are parsed correctly using
      // different patterns from the scan output.
      const stdout = 'Threat detected: Trojan:Win32/Malware\nThreat Adware:Win32/Suspicious was detected\n';
      const stderr = 'Found Virus:Win32/Test threat\n';

      // Act
      const result = (instance as AntivirusWindowsDefender)['parseVirusNames'](stdout, stderr, true);

      // Assert
      expect(result).toContain('Trojan:Win32/Malware');
      expect(result).toContain('Adware:Win32/Suspicious');
      expect(result).toContain('Virus:Win32/Test');
    });

    it('should remove file: prefixes and quotes from virus names', () => {
      // Verifies that file prefixes and quotes are removed
      // from parsed virus names.
      const stdout = 'Threat detected: file:"Trojan:Win32/Malware"\n';
      const stderr = '';

      // Act
      const result = (instance as AntivirusWindowsDefender)['parseVirusNames'](stdout, stderr, true);

      // Assert
      expect(result).toContain('Trojan:Win32/Malware');
      expect(result).not.toContain('file:');
      expect(result).not.toContain('"');
    });

    it('should avoid duplicate virus names', () => {
      // Ensures that duplicate virus names are avoided in the parsed output.
      const stdout = 'Threat detected: Trojan:Win32/Malware\nThreat detected: Trojan:Win32/Malware\nThreat: Threat\n';
      const stderr = '';

      // Act
      const result = (instance as AntivirusWindowsDefender)['parseVirusNames'](stdout, stderr, true);

      // Assert - Make sure duplicates are eliminated but different threats remain
      expect(result).toEqual(['Trojan:Win32/Malware', 'Threat']);
    });

    it('should use default name when no threats are parsed but file is infected', () => {
      // Verifies that a default name is used when no threats are parsed
      // but the file is infected.
      const stdout = 'Some output without threat names';
      const stderr = '';

      // Act
      const result = (instance as AntivirusWindowsDefender)['parseVirusNames'](stdout, stderr, true);

      // Assert
      expect(result).toEqual(['Windows.Defender.Threat.Detected']);
    });
  });

  describe('stop', () => {
    it('should stop Windows Defender successfully', async () => {
      // Verifies that Windows Defender is stopped successfully.
      const instance = await AntivirusWindowsDefender.createInstance();

      // Act
      await instance.stop();

      // Assert
      expect((instance as AntivirusWindowsDefender)['isInitialized']).toBe(false);
    });
  });
});
