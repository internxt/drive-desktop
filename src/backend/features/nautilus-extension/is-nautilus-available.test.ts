const { execAsyncMock } = vi.hoisted(() => ({
  execAsyncMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:util', () => ({
  promisify: vi.fn(() => execAsyncMock),
}));

import { isNautilusAvailable } from './is-nautilus-available';

type ExecAsyncResult = {
  stdout: string;
  stderr: string;
};

type Props = {
  desktopEntry: string;
  hasNautilusBinary: boolean;
};

function mockExecWith({ desktopEntry, hasNautilusBinary }: Props) {
  execAsyncMock.mockImplementation(async (command: string) => {
    if (command === 'xdg-mime query default inode/directory') {
      return {
        stdout: `${desktopEntry}\n`,
        stderr: '',
      } as ExecAsyncResult;
    }

    if (command === 'command -v nautilus') {
      if (hasNautilusBinary) {
        return {
          stdout: '/usr/bin/nautilus\n',
          stderr: '',
        } as ExecAsyncResult;
      } else {
        throw new Error('nautilus not found');
      }
    }

    throw new Error(`Unexpected command: ${command}`);
  });
}

describe('is-nautilus-available', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when nautilus is default and binary exists', async () => {
    mockExecWith({
      desktopEntry: 'org.gnome.Nautilus.desktop',
      hasNautilusBinary: true,
    });

    const result = await isNautilusAvailable();

    expect(result).toBe(true);
    expect(execAsyncMock).toHaveBeenNthCalledWith(1, 'xdg-mime query default inode/directory');
    expect(execAsyncMock).toHaveBeenNthCalledWith(2, 'command -v nautilus');
  });

  it('returns false when default explorer is not nautilus', async () => {
    mockExecWith({
      desktopEntry: 'nemo.desktop',
      hasNautilusBinary: true,
    });

    const result = await isNautilusAvailable();

    expect(result).toBe(false);
    expect(execAsyncMock).toHaveBeenCalledTimes(1);
    expect(execAsyncMock).toHaveBeenCalledWith('xdg-mime query default inode/directory');
  });

  it('returns false when nautilus binary is missing', async () => {
    mockExecWith({
      desktopEntry: 'org.gnome.Nautilus.desktop',
      hasNautilusBinary: false,
    });

    const result = await isNautilusAvailable();

    expect(result).toBe(false);
    expect(execAsyncMock).toHaveBeenCalledTimes(2);
  });

  it('returns true when default desktop entry is empty and nautilus binary exists', async () => {
    mockExecWith({
      desktopEntry: '',
      hasNautilusBinary: true,
    });

    const result = await isNautilusAvailable();

    expect(result).toBe(true);
    expect(execAsyncMock).toHaveBeenCalledTimes(2);
  });
});
