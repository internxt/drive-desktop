import Logger from 'electron-log';
import { exec } from 'child_process';
import configStore from '../../main/config';

const driveObject = {
  host: 'localhost',
  port: '1900'
};
const driveURL = `http://${driveObject.host}:${driveObject.port}`;
const driveName = 'Internxt Drive';

export const mountDrive = async (): Promise<boolean> => {
  if (process.platform === 'win32') {
    const driveLetter = await getLetterDrive();
    Logger.log(`[VirtualDrive] Drive letter available: ${driveLetter}`);
    if (driveLetter) {
      configStore.set('virtualdriveWindowsLetter', driveLetter);
      const mounted = await mountWindowsDrive(driveLetter);
      if (mounted) {
        await renameWindowsDrive();
      }
      return mounted;
    }
  } else if (process.platform === 'darwin') {
    return await mountMacOSDrive(driveName);
  } else if (process.platform === 'linux') {
    return await mountLinuxDrive();
  }
  return false;
};

export const unmountDrive = async () => {
  if (process.platform === 'win32') {
    return unmountWindowsDrive(getSavedLetter());
  } else if (process.platform === 'darwin' || process.platform === 'linux') {
    return unmountUnixDrive();
  }
  return false;
};

export const getVirtualDrivePath = () => {
  if (process.platform === 'win32') {
    return getSavedLetter() + ':\\';
  } else {
    return '~/InternxtDrive/';
  }
};

const getSavedLetter = () => {
  return configStore.get('virtualdriveWindowsLetter') || 'I';
};

const getUsedLetterDrives = (): Promise<string[]> => {
  Logger.log('[VirtualDrive] Getting used drive letters');
  return new Promise(function (resolve, reject) {
    exec('(Get-PSDrive -PSProvider FileSystem).Name', { shell: 'powershell.exe' },
      (errList, stdoutList) => {
        if (errList) {
          Logger.log(`[VirtualDrive] Error getting used drive letters: ${errList}`);
          reject(`[VirtualDrive] Error getting used drive letters: ${errList}`);
        } else {
          const arrayUsedLetterDrive = stdoutList.split(/\r?\n/).filter(l => l && l.length === 1);

          Logger.log(`[VirtualDrive] Used drive letters: ${arrayUsedLetterDrive.toString()}`);
          resolve(arrayUsedLetterDrive);
        }
      }
    );
  });
};

const getLetterDrive = async (): Promise<string | false> => {
  const savedLetter = getSavedLetter() || 'I';
  const usedLetters = await getUsedLetterDrives();
  const windowsAllowedDriveLetters = 'IXTABCDEFGHJKLMNOPQRSUVWYZ'.split('');
  const allowedLetters = windowsAllowedDriveLetters.filter(l => !usedLetters.includes(l));
  Logger.log('[VirtualDrive] Getting drive letter', { savedLetter, usedLetters, allowedLetters });

  if (usedLetters.includes(savedLetter)) {
    // current saved drive letter is in use
    if (allowedLetters.length > 0) {
      return allowedLetters[0];
    } else {
      return false;
    }
  } else {
    return savedLetter;
  }
};

const mountWindowsDrive = (driveLetter: string): Promise<boolean> => {
  Logger.log('[VirtualDrive] Mounting drive: ' + driveLetter);
  return new Promise(function (resolve, reject) {
    exec(
      `(New-Object -Com WScript.Network).MapNetworkDrive("${driveLetter}:", "${driveURL}")`,
      { shell: 'powershell.exe' },
      (errMount, stdoutMount) => {
        if (errMount) {
          Logger.log(`[VirtualDrive] Error creating drive: ${errMount}`);
          reject(`[VirtualDrive] Error creating drive: ${errMount}`);
        } else {
          Logger.log(`[VirtualDrive] Drive created and mounted successfully: ${stdoutMount}`);
          resolve(true);
        }
      }
    );
  });
};

const renameWindowsDrive = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Renaming drive');
  return new Promise(function (resolve, reject) {
    exec(
      `(New-Object -ComObject shell.application).NameSpace("${getVirtualDrivePath()}").self.name = "${driveName}"`,
      { shell: 'powershell.exe' },
      (errNaming, stdoutNaming) => {
        if (errNaming) {
          Logger.log(`[VirtualDrive] Error renaming drive: ${errNaming}`);
          reject(`[VirtualDrive] Error renaming drive: ${errNaming}`);
        } else {
          Logger.log(`[VirtualDrive] Drive renamed successfully: ${stdoutNaming}`);
          resolve(true);
        }
      }
    );
  });
};

const unmountWindowsDrive = (driveLetter: string): Promise<boolean> => {
  Logger.log('[VirtualDrive] Unmounting drive: ' + driveLetter);
  return new Promise(function (resolve, reject) {
    exec(
      `(New-Object -Com WScript.Network).RemoveNetworkDrive("${driveLetter}:")`,
      { shell: 'powershell.exe' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error unmounting drive: ${err}`);
          reject(`[VirtualDrive] Error unmounting drive: ${err}`);
        } else {
          Logger.log(`[VirtualDrive] Drive unmounted successfully: ${stdout}`);
          resolve(true);
        }
      }
    );
  });
};

const cleanWindowsDrives = () => {
  Logger.log('[VirtualDrive] Cleaning drives');
  exec(
    `((Get-CimInstance -Class Win32_NetworkConnection) | Where-Object {$_.remotename -match '\\\\${driveObject.host}@${driveObject.port}\\DavWWWRoot'}).LocalName`,
    { shell: 'powershell.exe' },
    (err, stdout) => {
      if (err) {
        Logger.log(`[VirtualDrive] Error getting drives: ${err}`);
      } else {
        const currentWebdavMountedDrives = stdout.split(/\r?\n/).filter(l => l && l.length === 2);
        Logger.log('[VirtualDrive] Current webdav mounted drives:', { currentWebdavMountedDrives });
        currentWebdavMountedDrives.forEach((driveLetter) => {
          unmountWindowsDrive(driveLetter);
        });
      }
    }
  );
};

const createUnixFolder = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Creating drive folder');
  return new Promise(function (resolve, reject) {
    exec(
      `mkdir -p ${getVirtualDrivePath()}`,
      { shell: '/bin/bash' },
      (errFolder, stdoutFolder) => {
        if (errFolder) {
          Logger.log(`[VirtualDrive] Error creating drive folder: ${errFolder}`);
          reject(`[VirtualDrive] Error creating drive folder: ${errFolder}`);
        } else {
          Logger.log(
            `[VirtualDrive] Drive folder created successfully: ${stdoutFolder}`
          );
          resolve(true);
        }
      }
    );
  });
};

const mountMacOSDrive = (driveName: string): Promise<boolean> => {
  Logger.log('[VirtualDrive] Mounting drive');
  return new Promise(function (resolve, reject) {
    createUnixFolder().then(() => {
      exec(
        `mount_webdav -S -v '${driveName}' ${driveURL} ${getVirtualDrivePath()}`,
        { shell: '/bin/bash' },
        (errMount, stdoutMount) => {
          if (errMount) {
            Logger.log(`[VirtualDrive] Error mounting drive: ${errMount}`);
            reject(`[VirtualDrive] Error mounting drive: ${errMount}`);
          } else {
            Logger.log(
              `[VirtualDrive] Drive mounted successfully: ${stdoutMount}`
            );
            resolve(true);
          }
        }
      );
    }).catch((err) => {
      reject(err);
    });
  });
};

const unmountUnixDrive = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Unmounting drive');
  return new Promise(function (resolve, reject) {
    exec(
      `umount ${getVirtualDrivePath()}`,
      { shell: '/bin/bash' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error unmounting drive: ${err}`);
          reject(`[VirtualDrive] Error unmounting drive: ${err}`);
        } else {
          Logger.log(`[VirtualDrive] Drive unmounted successfully: ${stdout}`);
          resolve(true);
        }
      }
    );
  });
};

const mountLinuxDrive = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Mounting drive');
  return new Promise(function (resolve, reject) {
    createUnixFolder().then(() => {
      exec(
        `mount -t webdav ${driveURL} ${getVirtualDrivePath()}`,
        { shell: '/bin/bash' },
        (errMount, stdoutMount) => {
          if (errMount) {
            Logger.log(`[VirtualDrive] Error mounting drive: ${errMount}`);
            reject(`[VirtualDrive] Error mounting drive: ${errMount}`);
          } else {
            Logger.log(
              `[VirtualDrive] Drive mounted successfully: ${stdoutMount}`
            );
            resolve(true);
          }
        }
      );
    }).catch((err) => {
      reject(err);
    });
  });
};
