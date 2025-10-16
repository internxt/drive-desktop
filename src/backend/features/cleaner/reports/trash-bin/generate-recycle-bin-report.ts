import { logger } from '@internxt/drive-desktop-core/build/backend';
import { processRecycleBinOutput } from './process-recycle-bin-output';
import { CleanerSection } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { NodeModule } from '@/infra/node/node.module';

export async function generateRecycleBinReport(): Promise<CleanerSection> {
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

  const { data, error } = await NodeModule.spawn({
    command: 'powershell',
    args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powershellScript],
  });

  if (data) {
    const report = processRecycleBinOutput(data.stdout, data.stderr);
    return report;
  }

  logger.error({
    tag: 'CLEANER',
    msg: 'Error scanning Recycle Bin with PowerShell',
    error,
  });

  return { totalSizeInBytes: 0, items: [] };
}
