import os from 'node:os';
import path from 'node:path';
import { LogFilesPaths } from '../../cleaner.types';

export function getLogsFilePaths() {
  const homeDir = os.homedir();
  const userProfile = process.env.USERPROFILE ?? homeDir;

  const localAppData = process.env.LOCALAPPDATA ?? path.join(userProfile, "AppData", "Local");
  const roamingAppData = process.env.APPDATA ?? path.join(userProfile, "AppData", "Roaming");
  const programData = process.env.ProgramData ?? "C:\\ProgramData";
  const userProfileAppData = path.join(userProfile, "AppData", "Local");

  return {
    localLogs: path.join(localAppData),
    roamingLogs: path.join(roamingAppData),
    programDataLogs: programData,
    systemLogs: "C:\\Windows\\Logs",
    userProfileLogs: userProfileAppData,
  } as LogFilesPaths;
}
