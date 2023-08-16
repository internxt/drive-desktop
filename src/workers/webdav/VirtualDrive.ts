import Logger from 'electron-log';
import { exec } from 'child_process';
import configStore from '../../main/config';
import { homedir } from 'os';

export enum VirtualDriveStatus {
  MOUNTING = 'MOUNTING',
  MOUNTED = 'MOUNTED',
  FAILED_TO_MOUNT = 'FAILED_TO_MOUNT',
  UNMOUNTED = 'UNMOUNTED',
}
const driveObject = {
  host: 'Virtual.Drive.Internxt.com',
  port: '1900',
};
const driveURL = `http://${driveObject.host}:${driveObject.port}`;
const driveName = 'Internxt Drive';

export const mountDrive = async (): Promise<void> => {
  if (process.platform === 'win32') {
    try {
      await unmountDrive();
    } catch (err) { Logger.error('Ignoring error on unmount', { err }); };


    const driveLetter = await getLetterDrive();
    Logger.log(`[VirtualDrive] Drive letter available: ${driveLetter}`);
    if (driveLetter) {
      configStore.set('virtualdriveWindowsLetter', driveLetter);

      const isHyperVenabled = await getWindowsHyperVEnabled();
      if (!isHyperVenabled) {
        await enableWindowsHyperV();
      }

      const mounted = await mountVHDWindowsDrive(driveLetter);
      if (mounted) {
        await renameWindowsDrive();
      }
    }
    return;
  } else if (process.platform === 'darwin') {
    await mountMacOSDrive(driveName);
    return;
  } else if (process.platform === 'linux') {
    await mountLinuxDrive();
    return;
  }

  return Promise.reject(
    new Error(`Platform ${process.platform} not supported`)
  );
};

export const unmountDrive = async (): Promise<boolean> => {
  if (process.platform === 'win32') {
    await ejectMountedVHDDrives();
    return removeVHDDrive();
  } else if (process.platform === 'darwin') {
    return unmountMacOSDrive();
  } else if (process.platform === 'linux') {
    return unmountLinuxDrive();
  }
  return false;
};

export const getVirtualDrivePath = () => {
  if (process.platform === 'win32') {
    return getSavedLetter() + ':\\';
  } else {
    return homedir() + '/InternxtDrive';
  }
};

/**
 * Retry the virtual drive mounting by trying to unmount it first,
 * and mount it again
 */
export const retryVirtualDriveMount = async () => {
  await unmountDrive();
  await mountDrive();
};

const getSavedLetter = () => {
  return configStore.get('virtualdriveWindowsLetter') || 'I';
};

const getUsedLetterDrives = (): Promise<string[]> => {
  Logger.log('[VirtualDrive] Getting used drive letters');
  return new Promise(function (resolve, reject) {
    exec(
      '(Get-PSDrive -PSProvider FileSystem).Name',
      { shell: 'powershell.exe' },
      (errList, stdoutList) => {
        if (errList) {
          Logger.log(
            `[VirtualDrive] Error getting used drive letters: ${errList}`
          );
          reject(`[VirtualDrive] Error getting used drive letters: ${errList}`);
        } else {
          const arrayUsedLetterDrive = stdoutList
            .split(/\r?\n/)
            .filter((l) => l && l.length === 1);

          Logger.log(
            `[VirtualDrive] Used drive letters: ${arrayUsedLetterDrive.toString()}`
          );
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
  const allowedLetters = windowsAllowedDriveLetters.filter(
    (l) => !usedLetters.includes(l)
  );
  Logger.log('[VirtualDrive] Getting drive letter', {
    savedLetter,
    usedLetters,
    allowedLetters,
  });

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

const mountWebdavWindowsDrive = (driveLetter: string): Promise<boolean> => {
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
          Logger.log(
            `[VirtualDrive] Drive created and mounted successfully: ${stdoutMount}`
          );
          resolve(true);
        }
      }
    );
  });
};

const mountVHDWindowsDrive = (driveLetter: string): Promise<boolean> => {
  Logger.log('[VirtualDrive] Mounting VHD drive: ' + driveLetter);
  return new Promise(function (resolve, reject) {
    exec(
      `New-VHD -Path .\\Internxt.vhdx -Dynamic -SizeBytes 10GB |Mount-VHD -Passthru |Initialize-Disk -Passthru |
      New-Partition -DriveLetter ${driveLetter} -UseMaximumSize |Format-Volume -FileSystem NTFS -Confirm:$false -Force`,
      { shell: 'powershell.exe' },
      (errMount, stdoutMount) => {
        if (errMount) {
          Logger.log(`[VirtualDrive] Error creating VHD drive: ${errMount}`);
          reject(`[VirtualDrive] Error creating VHD drive: ${errMount}`);
        } else {
          Logger.log(
            `[VirtualDrive] VHD Drive created and mounted successfully: ${stdoutMount}`
          );
          resolve(true);
        }
      }
    );
  });
};

const removeVHDDrive = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Removing VHD drive');
  return new Promise(function (resolve, reject) {
    exec('Remove-Item .\\Internxt.vhdx',
      { shell: 'powershell.exe' },
      (errMount, stdoutMount) => {
        if (errMount) {
          Logger.log(`[VirtualDrive] Error removing VHD drive: ${errMount}`);
          reject(`[VirtualDrive] Error removing VHD drive: ${errMount}`);
        } else {
          Logger.log(
            `[VirtualDrive] VHD Drive removed successfully: ${stdoutMount}`
          );
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
          Logger.log(
            `[VirtualDrive] Drive renamed successfully: ${stdoutNaming}`
          );
          resolve(true);
        }
      }
    );
  });
};

const unmountWindowsWebdavDrive = (driveLetter: string): Promise<boolean> => {
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

const ejectVHDDrive = (driveLetter: string): Promise<boolean> => {
  Logger.log('[VirtualDrive] ejecting VHD drive: ' + driveLetter);
  return new Promise(function (resolve, _) {
    exec(
      `(New-Object -comObject Shell.Application).NameSpace(17).ParseName("${driveLetter}:").InvokeVerb("Eject")`,
      { shell: 'powershell.exe' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error ejecting drive: ${err}`);
          resolve(false);
        } else {
          Logger.log(`[VirtualDrive] Drive ejected successfully: ${stdout}`);
          resolve(true);
        }
      }
    );
  });
};

const ejectMountedVHDDrives = async () => {
  const mountedVHDs = await getCurrentWindowsMountedVHDs();
  for (const mountedVHD of mountedVHDs) {
    await ejectVHDDrive(mountedVHD);
  }
};

const getWindowsHyperVEnabled = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Getting Windows HyperV is enabled');
  return new Promise(function (resolve, reject) {
    exec('(Get-WindowsOptionalFeature -FeatureName Microsoft-Hyper-V-All -Online).State',
      { shell: 'powershell.exe' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error getting Windows HyperV: ${err}`);
          reject(`[VirtualDrive] Error getting Windows HyperV: ${err}`);
        } else {
          const stateHyperV = stdout.trim().toLowerCase();
          Logger.log('[VirtualDrive] Is Windows HyperV enabled:', { stateHyperV });
          resolve(stateHyperV === 'enabled');
        }
      }
    );
  });
};

const enableWindowsHyperV = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Enabling HyperV');
  return new Promise(function (resolve, reject) {
    exec('Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All',
      { shell: 'powershell.exe' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error enabling HyperV: ${err}`);
          reject(`[VirtualDrive] Error enabling HyperV: ${err}`);
        } else {
          Logger.log(`[VirtualDrive] Enabled HyperV successfully: ${stdout}`);
          resolve(true);
        }
      }
    );
  });
};

const getCurrentWindowsMountedVHDs = (): Promise<string[]> => {
  Logger.log('[VirtualDrive] Getting CurrentMountedVHD');
  return new Promise(function (resolve, _) {
    exec('(Get-Volume | Where-Object {$_.FileSystemLabel -eq "Internxt Drive"}).DriveLetter',
      { shell: 'powershell.exe' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error getting mounted VHDs: ${err}`);
          resolve([] as string[]);
        } else {
          const currentWebdavMountedVHDs = stdout
            .split(/\r?\n/)
            .filter((l) => l && l.length === 1);
          Logger.log('[VirtualDrive] Current mounted VHDs:', {
            currentWebdavMountedVHDs,
          });
          resolve(currentWebdavMountedVHDs);
        }
      }
    );
  });
};

const getCurrentWindowsMountedWebdavDrives = (): Promise<string[]> => {
  Logger.log('[VirtualDrive] Getting CurrentMountedDrives');
  return new Promise(function (resolve, reject) {
    exec(
      `(Get-PSDrive -PSProvider FileSystem | Where-Object {$_.DisplayRoot -match '\\\\\\\\${driveObject.host}@${driveObject.port}\\\\DavWWWRoot'}).Name`,
      { shell: 'powershell.exe' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error getting drives: ${err}`);
          reject(`[VirtualDrive] Error getting drives: ${err}`);
        } else {
          const currentWebdavMountedDrives = stdout
            .split(/\r?\n/)
            .filter((l) => l && l.length === 1);
          Logger.log('[VirtualDrive] Current webdav mounted drives:', {
            currentWebdavMountedDrives,
          });
          resolve(currentWebdavMountedDrives);
        }
      }
    );
  });
};

const createUnixFolder = (): Promise<boolean> => {
  Logger.log('[VirtualDrive] Creating drive folder');
  return new Promise(function (resolve, reject) {
    exec(
      `mkdir -p ${getVirtualDrivePath()}`,
      { shell: '/bin/bash' },
      (errFolder, stdoutFolder) => {
        if (errFolder) {
          Logger.log(
            `[VirtualDrive] Error creating drive folder: ${errFolder}`
          );
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
    createUnixFolder()
      .then(() => {
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
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const unmountMacOSDrive = (): Promise<boolean> => {
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

const ejectMacOSDisk = (disk: string): Promise<boolean> => {
  Logger.log('[VirtualDrive] Ejecting disk');
  return new Promise(function (resolve, reject) {
    exec(`diskutil eject "${disk}"`,
      { shell: '/bin/bash' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error ejecting disk: ${err}`);
          reject(`[VirtualDrive] Error ejecting disk: ${err}`);
        } else {
          Logger.log(`[VirtualDrive] Disk ejected successfully: ${stdout}`);
          resolve(true);
        }
      }
    );
  });
};

const getMacOSMountedInstallerDisks = (): Promise<string[]> => {
  Logger.log('[VirtualDrive] Getting Current Mounted Installer Disks');
  return new Promise(function (resolve, reject) {
    exec('find /Volumes -type d -name \'Internxt Drive *\' -maxdepth 1',
      { shell: '/bin/bash' },
      (err, stdout) => {
        if (err) {
          Logger.log(`[VirtualDrive] Error installer disks: ${err}`);
          reject(`[VirtualDrive] Error installer disks: ${err}`);
        } else {
          const currentMountedInstallerDisks = stdout
            .split(/\r?\n/)
            .filter((l) => l && l.length > 0 && l.startsWith('/Volumes/Internxt Drive '));
          Logger.log('[VirtualDrive] Current mounted installer disks:', {
            currentMountedInstallerDisks,
          });
          resolve(currentMountedInstallerDisks);
        }
      }
    );
  });
};

export const ejectMacOSInstallerDisks = async (): Promise<void> => {
  const installerDisks = await getMacOSMountedInstallerDisks();
  installerDisks.forEach((installerDisk) => {
    ejectMacOSDisk(installerDisk).catch();
  });
};

const mountLinuxDrive = async (): Promise<boolean> => {
  const mount = (uri: string) => {
    return new Promise<void>((resolve, reject) => {
      exec(`gio mount ${uri}`, { shell: '/bin/bash' }, (errMount) => {
        if (errMount) {
          reject(errMount);
        } else {
          resolve();
        }
      });
    });
  };

  const createdSimlink = (uri: string) => {
    return new Promise<void>((resolve, reject) => {
      exec(
        `gio info ${uri} | awk -F': ' '/^local path: /{print $2}' | xargs -I_ ln -s _  ${getVirtualDrivePath()}`,
        { shell: '/bin/bash' },
        (errMount) => {
          if (errMount) {
            reject(errMount);
          } else {
            resolve();
          }
        }
      );
    });
  };

  try {
    Logger.log('[VirtualDrive] Mounting drive');
    const davUri = `dav://${driveObject.host}:${driveObject.port}`;

    await mount(davUri);

    await createdSimlink(davUri);

    Logger.log('[VirtualDrive] Drive mounted successfully');
    return true;
  } catch (err: unknown) {
    Logger.log(
      `[VirtualDrive] Error mounting drive: ${(err as Error).message}`
    );
    return false;
  }
};

async function unmountLinuxDrive(): Promise<boolean> {
  Logger.log('[VirtualDrive] Unmounting drive');
  const unlink = new Promise<boolean>(function (resolve, reject) {
    exec(
      `rm ${getVirtualDrivePath()}`,
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

  const unmont = new Promise<boolean>(function (resolve, reject) {
    exec(
      `gio mount -u dav://${driveObject.host}:${driveObject.port}`,
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

  const settled = await Promise.allSettled([unlink, unmont]);

  return settled.every((promise) => promise.status === 'fulfilled');
}
