import { spawn } from 'child_process';
import { ScanResult } from './types';
import { parseVirusNames } from './parse-virus-names';

export function scanFile(filePath: string, mpCmdRunPath: string): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    const process = spawn(mpCmdRunPath, ['-Scan', '-ScanType', '3', '-File', filePath]);

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
      const detectedViruses = parseVirusNames(stdout, stderr, isInfected);

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
