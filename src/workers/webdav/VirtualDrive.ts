import Logger from 'electron-log';
import { exec } from 'child_process';

export const mountDrive = (driveName = 'Internxt Drive', driveLetter = 'X') => {
  if (process.platform === 'win32') {
    mountWindowsDrive(driveName, driveLetter);
  } else if (process.platform === 'darwin') {
    mountMacOSDrive(driveName);
  } else if (process.platform === 'linux') {
    mountLinuxDrive();
  }
};

export const unmountDrive = (driveLetter = 'X') => {
  if (process.platform === 'win32') {
    unmountWindowsDrive(driveLetter);
  } else if (process.platform === 'darwin') {
    unmountMacOSDrive();
  } else if (process.platform === 'linux') {
    unmountLinuxDrive();
  }
};

const driveURL = `http://localhost:1900`;

const mountWindowsDrive = (driveName: string, driveLetter: string) => {
  Logger.log('Mounting drive');
  exec(
    `net use ${driveLetter}: "${driveURL}" /P:Yes`,
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
  Logger.log('Unmounting drive');
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

const mountMacOSDrive = (driveName: string) => {
  Logger.log('Mounting drive');
  exec(
    `mkdir -p ~/InternxtDrive`,
    { shell: '/bin/bash' },
    (errFolder, stdoutFolder) => {
      if (errFolder) {
        Logger.error(`Error creating drive folder: ${errFolder}`);
        return;
      }
      exec(
        `mount_webdav -S -v '${driveName}' ${driveURL} ~/InternxtDrive/`,
        { shell: '/bin/bash' },
        (errMount, stdoutMount) => {
          if (errMount) {
            Logger.error(`Error mounting drive: ${errMount}`);
            return;
          }

          Logger.log(`Drive mounted successfully: ${stdoutMount}`);
        }
      );

      Logger.log(`Drive folder created successfully: ${stdoutFolder}`);
    }
  );
};

const unmountMacOSDrive = () => {
  Logger.log('Unmounting drive');
  exec('umount ~/InternxtDrive/', { shell: '/bin/bash' }, (err, stdout) => {
    if (err) {
      Logger.error(`Error unmounting drive: ${err}`);
      return;
    }
    Logger.log(`Drive unmounted successfully: ${stdout}`);
  });
};

const mountLinuxDrive = () => {
  Logger.log('Mounting drive');
  exec(
    `mkdir -p ~/InternxtDrive`,
    { shell: '/bin/bash' },
    (errFolder, stdoutFolder) => {
      if (errFolder) {
        Logger.error(`Error creating drive folder: ${errFolder}`);
        return;
      }
      exec(
        `mount -t webdav ${driveURL} ~/InternxtDrive/`,
        { shell: '/bin/bash' },
        (errMount, stdoutMount) => {
          if (errMount) {
            Logger.error(`Error mounting drive: ${errMount}`);
            return;
          }

          Logger.log(`Drive mounted successfully: ${stdoutMount}`);
        }
      );

      Logger.log(`Drive folder created successfully: ${stdoutFolder}`);
    }
  );
};

const unmountLinuxDrive = () => {
  Logger.log('Unmounting drive');
  exec('umount ~/InternxtDrive/', { shell: '/bin/bash' }, (err, stdout) => {
    if (err) {
      Logger.error(`Error unmounting drive: ${err}`);
      return;
    }
    Logger.log(`Drive unmounted successfully: ${stdout}`);
  });
};
