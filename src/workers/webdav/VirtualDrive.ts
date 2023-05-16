import Logger from 'electron-log';
import { exec } from 'child_process';

export const mountDrive = (driveName = 'Internxt Drive', driveLetter = 'X') => {
  if (process.platform === 'win32') {
    mountWindowsDrive(driveName, driveLetter);
  }
};

export const unmountDrive = (driveLetter = 'X') => {
  if (process.platform === 'win32') {
    unmountWindowsDrive(driveLetter);
  }
};

const drivePath = `http://localhost:1900`;

const mountWindowsDrive = (driveName: string, driveLetter: string) => {
  exec(
    `net use ${driveLetter}: "${drivePath}" /P:Yes`,
    { shell: 'powershell.exe' },
    (errMount, stdoutMount) => {
      if (errMount) {
        Logger.error(`Error creating drive: ${errMount}`);
        return;
      }
      exec(
        `(New-Object -ComObject shell.application).NameSpace("${driveLetter}:\\").self.name = "${driveName}"`,
        { shell: 'powershell.exe' },
        (errNaming, stdoutNaming) => {
          if (errNaming) {
            Logger.error(`Error naming drive: ${errNaming}`);
            return;
          }

          Logger.log(`Drive named successfully: ${stdoutNaming}`);
        }
      );

      Logger.log(`Drive created and mounted successfully: ${stdoutMount}`);
    }
  );
};

const unmountWindowsDrive = (driveLetter: string) => {
  exec(
    `net use ${driveLetter}: /Delete /y`,
    { shell: 'powershell.exe' },
    (err, stdout) => {
      if (err) {
        Logger.error(`Error unmounting drive: ${err}`);
        return;
      }

      Logger.log(`Drive unmounted successfully: ${stdout}`);
    }
  );
};
