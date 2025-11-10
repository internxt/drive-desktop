import '@testing-library/jest-dom';
import path from 'node:path/posix';

window.electron = {
  path,
  driveGetSyncRoot: vi.fn(),
} as Partial<typeof window.electron> as typeof window.electron;
