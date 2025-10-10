import { spawn } from 'node:child_process';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { processRecycleBinOutput } from './process-recycle-bin-output';
import { CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

export function generateRecycleBinReport(): Promise<CleanerSection> {
  return new Promise((resolve) => {
    logger.debug({ tag: 'CLEANER', msg: 'Starting Recycle Bin scan using PowerShell COM API...' });

    const powershellScript = `
    $shell = New-Object -ComObject Shell.Application
    $recycleBin = $shell.Namespace(0xA)
    $items = $recycleBin.Items()

    foreach ($item in $items) {
        $name = $item.Name
        $path = $item.Path
        $size = $item.Size
        Write-Output "$name|$path|$size"
    }`;

    const process = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powershellScript]);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', () => {
      const report = processRecycleBinOutput(stdout, stderr);
      resolve(report);
    });

    process.on('error', (error) => {
      logger.error({
        tag: 'CLEANER',
        msg: 'Error scanning Recycle Bin with PowerShell',
        error,
      });

      resolve({
        totalSizeInBytes: 0,
        items: [],
      });
    });
  });
}
