import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const SYNC_ROOT_MANAGER_KEY = String.raw`HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\SyncRootManager`;
export const NAMESPACE_KEY = String.raw`HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace`;
export const CLSID_KEY = String.raw`HKCU\Software\Classes\CLSID`;

const VALUE_REGEX = /^ {4}(.+?) {4}REG_\w+ {4}(.*)$/;

const HIVES: Record<string, string> = {
  HKLM: 'HKEY_LOCAL_MACHINE',
  HKCU: 'HKEY_CURRENT_USER',
};

function expandHive({ key }: { key: string }) {
  const [hive, ...rest] = key.split('\\');
  return [HIVES[hive] ?? hive, ...rest].join('\\');
}

export async function queryKey({ key }: { key: string }) {
  const { stdout } = await execFileAsync('reg', ['query', key]);

  const prefix = `${expandHive({ key })}\\`;
  const values: Record<string, string> = {};
  const subKeys: string[] = [];

  for (const raw of stdout.split('\n')) {
    const line = raw.replace(/\r$/, '');

    const value = VALUE_REGEX.exec(line);
    if (value) {
      values[value[1]] = value[2];
      continue;
    }

    if (line.startsWith(prefix)) {
      subKeys.push(line.slice(prefix.length));
    }
  }

  return { values, subKeys };
}

export async function deleteKey({ key }: { key: string }) {
  await execFileAsync('reg', ['delete', key, '/f']);
}
