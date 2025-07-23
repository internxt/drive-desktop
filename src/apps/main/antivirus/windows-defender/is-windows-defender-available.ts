import { exec } from 'child_process';

export function isWindowsDefenderAvailable(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec('powershell "Get-MpComputerStatus | Select-Object -Property AMServiceEnabled"', (error, stdout, stderr) => {
      if (error) {
        return reject(`Error checking Windows Defender status: ${stderr}`);
      }

      const isEnabled = stdout.includes('True');
      resolve(isEnabled);
    });
  });
}
