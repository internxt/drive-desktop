import { spawn } from 'child_process';
import path from 'path';
import { readdirSync, existsSync, statSync } from 'fs';
import { IAntivirusEngine, ScanResult } from './IAntivirusEngine';

export class AntivirusWindowsDefender implements IAntivirusEngine {
  private isInitialized = false;
  private mpCmdRunPath = '';

  static async createInstance(): Promise<AntivirusWindowsDefender> {
    const instance = new AntivirusWindowsDefender();
    await instance.initialize();
    return instance;
  }

  async initialize(): Promise<void> {
    try {
      this.mpCmdRunPath = this.findMpCmdRun();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error Initializing Windows Defender:', error);
      throw error;
    }
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    if (!this.isInitialized) {
      throw new Error('Windows Defender is not initialized');
    }

    return new Promise((resolve, reject) => {
      const process = spawn(this.mpCmdRunPath, ['-Scan', '-ScanType', '3', '-File', filePath]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const exitCode = code || 0;
        const isInfected = exitCode === 2;

        // Parse the output to extract actual threat names
        const detectedViruses = this.parseVirusNames(stdout, stderr, isInfected);

        resolve({
          file: filePath,
          isInfected,
          viruses: detectedViruses,
        });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async stop() {
    this.isInitialized = false;
  }

  findMpCmdRun() {
    const DEFENDER_PLATFORM_PATH = 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform';
    const DEFENDER_FALLBACK_PATH = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';

    let fullPath = DEFENDER_FALLBACK_PATH;

    if (existsSync(DEFENDER_PLATFORM_PATH)) {
      const versions = readdirSync(DEFENDER_PLATFORM_PATH)
        .filter((name) => statSync(path.join(DEFENDER_PLATFORM_PATH, name)).isDirectory())
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })); // Order by version descending

      if (versions.length > 0) {
        fullPath = path.join(DEFENDER_PLATFORM_PATH, versions[0], 'MpCmdRun.exe');
      }
    }

    if (!existsSync(fullPath)) {
      throw new Error('MpCmdRun.exe not found.');
    }

    return fullPath;
  }

  /**
   * Parses the output from MpCmdRun.exe to extract actual virus names
   * @param stdout Standard output from MpCmdRun.exe
   * @param stderr Standard error from MpCmdRun.exe
   * @param isInfected Whether the file is infected
   * @returns Array of virus names found
   */
  private parseVirusNames(stdout: string, stderr: string, isInfected: boolean): string[] {
    if (!isInfected) {
      return [];
    }

    const output = stdout + stderr;
    const virusNames: string[] = [];

    const threatPatterns = [
      /Threat\s+detected:\s+(.+)/gi,
      /Threat\s+(.+?)\s+was\s+detected/gi,
      /Found\s+(.+?)\s+threat/gi,
      /Malware\s+(.+?)\s+detected/gi,
      /Virus\s+(.+?)\s+found/gi,
      /Infected\s+with\s+(.+?)([\s\n]|$)/gi,
    ];

    for (const pattern of threatPatterns) {
      const matches = output.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const virusName = match[1]
            .trim()
            .replace(/^file:/i, '')
            .replace(/["']/g, '');
          if (virusName && !virusNames.includes(virusName)) {
            virusNames.push(virusName);
          }
        }
      }
    }

    if (virusNames.length === 0) {
      virusNames.push('Windows.Defender.Threat.Detected');
    }

    return virusNames;
  }
}
