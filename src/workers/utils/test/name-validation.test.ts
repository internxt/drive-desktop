import { fileNameIsValid } from '../name-verification';

describe('name verifiaction test', () => {
  const invalidFileNames = [
    '..AppDataRoamingMicrosoftWindowsStart MenuProgramsStartup',
    'c:/all.txt',
    'C:windowswin.ini',
    'C:windowssystem.ini',
    'C:windowsiis.log',
    'C:windowsSystem32Driversetchosts',
    'C:Windowssystem32configSYSTEM',
    'C:windowsdebug\netsetup.log',
    'C:windowsdebugsammui.log',
    'C:windowsdebug\netlogon.log',
    'C:windowsdebugpasswd.log',
    'C:windowssystem32winevtlogssystem.evtx',
    'C:windowssystem32winevtlogsWindows Powershell.evtx',
    'C:windowsWindowsUpdate.log',
    'C:windowssystem32calc.exe',
    'C:windowssystem32windowspowershell\v1.0powershell.exe',
    'C:windowsccmlogs\filesystemfile.log',
    'C:\\usersadministratorappdatalocal\recently-used.xbel',
    'C:\\usersadministratordesktopdesktop.ini',
    'C:windowspanther\\unattended.xml',
    'C:windowspanther\\unattended\\unattended.xml',
    'C:windows\repairsam',
    'C:windowssystem32\tasksdaily',
    'C:windowspanthersysprep.inf',
    '/etc/passwd',
    '/etc/shadow',
    '/etc/crontab',
    'secret.doc%00.pdf',
  ];

  it.each(invalidFileNames)('returns false', (fileName: string) => {
    const result = fileNameIsValid(fileName);

    expect(result).toBe(false);
  });
});
