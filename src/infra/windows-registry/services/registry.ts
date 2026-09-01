import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const SYNC_ROOT_MANAGER_KEY = String.raw`HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\SyncRootManager`;
export const NAMESPACE_KEY = String.raw`HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace`;
export const CLSID_KEY = String.raw`HKCU\Software\Classes\CLSID`;

const VALUE_REGEX = /^ {4}(.+?) {4}REG_\w+ {4}(.*)$/;

export async function queryKeys({ key }: { key: string }) {
  const { stdout } = await execFileAsync('reg', ['query', key]);

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('HKEY_') && line.length > key.length)
    .map((line) => line.slice(line.lastIndexOf('\\') + 1));
}

export async function queryValues({ key }: { key: string }) {
  const { stdout } = await execFileAsync('reg', ['query', key]);

  const values: Record<string, string> = {};

  for (const line of stdout.split('\r\n')) {
    const match = VALUE_REGEX.exec(line);
    if (match) values[match[1]] = match[2];
  }

  return values;
}

export async function tryQueryValues({ key }: { key: string }) {
  try {
    return await queryValues({ key });
  } catch {
    return {};
  }
}

export async function deleteKey({ key }: { key: string }) {
  await execFileAsync('reg', ['delete', key, '/f']);
}
