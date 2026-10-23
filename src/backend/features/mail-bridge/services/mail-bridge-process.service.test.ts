import { ChildProcess, spawn } from 'node:child_process';
import { spawnMailBridge } from './mail-bridge-process.service';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn: vi.fn() };
});

describe('mail-bridge-process.service', () => {
  let child: ChildProcess;

  beforeEach(() => {
    child = new ChildProcess();
    vi.mocked(spawn).mockReturnValue(child);
    vi.stubEnv('MAIL_API_URL', 'https://mail.example.test');
    vi.stubEnv('MAIL_SERVER_PUBLIC_KEY', 'server-public-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('passes Mail configuration in a separate child environment', () => {
    // Given / When
    const result = spawnMailBridge({ endpoint: 'control-endpoint', stateDirectory: 'state-directory' });
    // Then
    expect(result).toEqual({ data: child, error: undefined });
    const options = vi.mocked(spawn).mock.calls[0][2];
    expect(options?.env).not.toBe(process.env);
    expect(options?.env).toMatchObject({ MAIL_API_URL: 'https://mail.example.test', MAIL_SERVER_PUBLIC_KEY: 'server-public-key' });
  });

  it('does not launch Bridge without a Mail API URL', () => {
    // Given
    vi.stubEnv('MAIL_API_URL', undefined);
    // When
    const result = spawnMailBridge({ endpoint: 'control-endpoint', stateDirectory: 'state-directory' });
    // Then
    expect(result).toEqual({ data: undefined, error: new Error('Mail Bridge requires MAIL_API_URL') });
    expect(spawn).not.toHaveBeenCalled();
  });
});
