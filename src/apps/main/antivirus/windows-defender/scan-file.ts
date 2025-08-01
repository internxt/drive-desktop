import { spawn } from 'child_process';
import { ScanResult } from './types';
import { parseVirusNames } from './parse-virus-names';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  filePath: string;
  mpCmdRunPath: string;
};

export function scanFile({ filePath, mpCmdRunPath }: TProps): Promise<ScanResult> {
  return new Promise((resolve) => {
    const process = spawn(mpCmdRunPath, ['-Scan', '-ScanType', '3', '-File', filePath, '-DisableRemediation']);

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

      const detectedViruses = isInfected ? parseVirusNames({ stdout, stderr }) : [];

      resolve({
        file: filePath,
        isInfected,
        viruses: detectedViruses,
      });
    });

    process.on('error', (error) => {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error scanning file with antivirus',
        error,
      });
    });
  });
}
