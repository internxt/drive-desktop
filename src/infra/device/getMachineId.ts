import { readFileSync } from 'fs';
import { Result } from '../../context/shared/domain/Result';

export class MachineIdError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'NO_ACCESS' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

/**
 * Reads the machine-id from /etc/machine-id.
 * This value uniquely identifies the current Linux installation.
 */
export function getMachineId(): Result<string, MachineIdError> {
  try {
    const id = readFileSync('/etc/machine-id', 'utf-8').trim();
    return id ? { data: id } : { error: new MachineIdError('NON_EXISTS') };
  } catch (err) {
    const code = err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
    if (code === 'ENOENT') {
      return { error: new MachineIdError('NON_EXISTS', err) };
    }
    if (code === 'EACCES') {
      return { error: new MachineIdError('NO_ACCESS', err) };
    }
    return { error: new MachineIdError('UNKNOWN', err) };
  }
}
