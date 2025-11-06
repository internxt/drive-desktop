import { execAsync } from '@/core/utils/exec-async';

class MachineGuidError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'NO_ACCESS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

export async function getMachineGuid() {
  try {
    const { stdout } = await execAsync(String.raw`reg query HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography /v MachineGuid`, {
      encoding: 'utf-8',
    });

    const regex = /MachineGuid\s+REG_SZ\s+(.+)/;
    const match = regex.exec(stdout);
    const machineGuid = match?.[1].trim();
    return machineGuid ? { data: machineGuid } : { error: new MachineGuidError('NON_EXISTS') };
  } catch (err) {
    return { error: new MachineGuidError('UNKNOWN', err) };
  }
}
