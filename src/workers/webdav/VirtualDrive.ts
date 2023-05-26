import Logger from 'electron-log';
import { exec } from 'child_process';
import { app } from 'electron';

export const mountDrive = (driveName = 'Internxt Drive', driveLetter = 'I') => {
  if (process.platform === 'win32') {
    mountWindowsDrive(driveName, driveLetter);
  } else if (process.platform === 'darwin') {
    mountMacOSDrive(driveName);
  } else if (process.platform === 'linux') {
    mountLinuxDrive();
  }
};

export const unmountDrive = (driveLetter = 'I') => {
  if (process.platform === 'win32') {
    unmountWindowsDrive(driveLetter);
  } else if (process.platform === 'darwin') {
    unmountMacOSDrive();
  } else if (process.platform === 'linux') {
    unmountLinuxDrive();
  }
};

export const getVirtualDrivePath = (driveLetter = 'I') => {
  if (process.platform === 'win32') {
    return driveLetter + ':\\';
  } else {
    return '~/InternxtDrive/';
  }
};

const driveURL = 'http://localhost:1900';

const mountWindowsDrive = (driveName: string, driveLetter: string) => {
  Logger.log('[VirtualDrive] Mounting drive');
  exec(
    `net use ${driveLetter}: "${driveURL}" /P:Yes`,
    { shell: 'powershell.exe' },
    (errMount, stdoutMount) => {
      if (errMount) {
        Logger.log(`[VirtualDrive] Error creating drive: ${errMount}`);
        return;
      }
      exec(
        `(New-Object -ComObject shell.application).NameSpace("${getVirtualDrivePath(
          driveLetter
        )}").self.name = "${driveName}"`,
        { shell: 'powershell.exe' },
        (errNaming, stdoutNaming) => {
          if (errNaming) {
            Logger.log(`[VirtualDrive] Error naming drive: ${errNaming}`);
            return;
          }

          Logger.log(
            `[VirtualDrive] Drive named successfully: ${stdoutNaming}`
          );
        }
      );

      Logger.log(
        `[VirtualDrive] Drive created and mounted successfully: ${stdoutMount}`
      );
    }
  );
};

const unmountWindowsDrive = (driveLetter: string) => {
  Logger.log('[VirtualDrive] Unmounting drive');
  exec(
    `net use ${driveLetter}: /Delete /y`,
    { shell: 'powershell.exe' },
    (err, stdout) => {
      if (err) {
        Logger.log(`[VirtualDrive] Error unmounting drive: ${err}`);
        return;
      }

      Logger.log(`[VirtualDrive] Drive unmounted successfully: ${stdout}`);
    }
  );
};

const mountMacOSDrive = (driveName: string) => {
  Logger.log('[VirtualDrive] Mounting drive');
  exec(
    `mkdir -p ${getVirtualDrivePath()}`,
    { shell: '/bin/bash' },
    (errFolder, stdoutFolder) => {
      if (errFolder) {
        Logger.log(`[VirtualDrive] Error creating drive folder: ${errFolder}`);
        return;
      }
      exec(
        `mount_webdav -S -v '${driveName}' ${driveURL} ${getVirtualDrivePath()}`,
        { shell: '/bin/bash' },
        (errMount, stdoutMount) => {
          if (errMount) {
            Logger.log(`[VirtualDrive] Error mounting drive: ${errMount}`);
            return;
          }

          Logger.log(
            `[VirtualDrive] Drive mounted successfully: ${stdoutMount}`
          );
        }
      );

      Logger.log(
        `[VirtualDrive] Drive folder created successfully: ${stdoutFolder}`
      );
    }
  );
};

const unmountMacOSDrive = () => {
  Logger.log('[VirtualDrive] Unmounting drive');
  exec(
    `umount ${getVirtualDrivePath()}`,
    { shell: '/bin/bash' },
    (err, stdout) => {
      if (err) {
        Logger.log(`[VirtualDrive] Error unmounting drive: ${err}`);
        return;
      }
      Logger.log(`[VirtualDrive] Drive unmounted successfully: ${stdout}`);
    }
  );
};

const mountLinuxDrive = () => {
  Logger.log('Mounting drive');
  exec(
    `mkdir -p ${getVirtualDrivePath()}`,
    { shell: '/bin/bash' },
    (errFolder, stdoutFolder) => {
      if (errFolder) {
        Logger.error(`Error creating drive folder: ${errFolder}`);
        return;
      }
      exec(
        `mount -t webdav ${driveURL} ${getVirtualDrivePath()}`,
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
  exec(
    `umount ${getVirtualDrivePath()}`,
    { shell: '/bin/bash' },
    (err, stdout) => {
      if (err) {
        Logger.error(`Error unmounting drive: ${err}`);
        return;
      }
      Logger.log(`Drive unmounted successfully: ${stdout}`);
    }
  );
};
