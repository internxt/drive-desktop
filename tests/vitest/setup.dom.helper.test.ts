import '@testing-library/jest-dom';
import path from 'node:path/posix';

globalThis.window.electron = {
  path,
  driveGetSyncRoot: vi.fn(),
} as Partial<typeof globalThis.window.electron> as typeof globalThis.window.electron;
