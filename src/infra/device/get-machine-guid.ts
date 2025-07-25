import { execSync } from 'child_process';

export class MachineGuidError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'NO_ACCESS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

/**
 * Reads the MachineGuid from Windows registry.
 * This value uniquely identifies the current Windows installation.
 */
export function getMachineGuid() {
  try {
    const output = execSync('reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', { encoding: 'utf-8' });

    const match = output.match(/MachineGuid\s+REG_SZ\s+(.+)/);
    const machineGuid = match?.[1].trim();
    return machineGuid ? { data: machineGuid } : { error: new MachineGuidError('NON_EXISTS') };
  } catch (err) {
    return { error: new MachineGuidError('NO_ACCESS', err) };
  }
}
