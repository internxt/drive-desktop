import { vi } from 'vitest';

vi.mock('@/apps/main/auth/service', () => {
  return {
    getUser: vi.fn(() => ({ uuid: 'mockUserUuid' })),
  };
});
