import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import * as issues from '@/apps/main/background-processes/issues';
import { AbsolutePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { validateWindowsName } from './validate-windows-name';

/**
 * BR-2245
 * We create placeholders through `\\?\` paths, which skip the win32 name parsing, so what we
 * can create is not what the rest of windows can reach: explorer parses the path, trims the
 * name and reports that the item does not exist, which is the folder the user sees and cannot
 * delete in BR-1796. This measures that difference instead of trusting the documentation, so
 * the rule set cannot drift back into rejecting names that work or accepting names that trap
 * the user. Powershell is used on purpose because node always goes through the device path.
 */
describe('validate-windows-name.infra', () => {
  partialSpyOn(issues, 'addSyncIssue');

  let rootPath: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, randomUUID());
    await mkdir(rootPath);
  });

  function isAddressableByWindows(name: string) {
    const win32Path = `${rootPath}/${name}`.replaceAll('/', '\\').replaceAll("'", "''");
    const devicePath = `\\\\?\\${win32Path}`;
    /**
     * `GetFileAttributesW` is asked instead of `Directory.Exists` because .net trims more trailing
     * whitespace than win32 does, and win32 is the layer explorer and every other program go
     * through, so it is win32 that decides whether the user can still reach the item.
     */
    const script = [
      `$ProgressPreference = 'SilentlyContinue'`,
      `$signature = '[DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern uint GetFileAttributesW(string path);'`,
      `$win32 = Add-Type -MemberDefinition $signature -Name 'Win32' -Namespace 'Infra' -PassThru`,
      `try { [System.IO.Directory]::CreateDirectory('${devicePath}') | Out-Null } catch { Write-Output 'NO'; exit }`,
      `if ($win32::GetFileAttributesW('${win32Path}') -ne [uint32]::MaxValue) { Write-Output 'YES' } else { Write-Output 'NO' }`,
    ].join('; ');

    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const stdout = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { encoding: 'utf8' });
    return stdout.trim() === 'YES';
  }

  const names = [
    'Facturas',
    ' Invoice',
    'CON',
    'LPT1',
    'Testi ',
    'Press U.S.',
    'Doc..',
    'Streamit 3.0 | Tema',
    'Nota: importante',
    'Todo*',
    'Reporte\u00a0',
  ];

  it.each(names)('should only accept %j if windows can reach it afterwards', (name) => {
    // Given
    const addressable = isAddressableByWindows(name);
    // When
    const { isValid } = validateWindowsName(mockProps<typeof validateWindowsName>({ name, path: name }));
    // Then
    expect(isValid).toBe(addressable);
  });
});
