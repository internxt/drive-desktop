import { useMutation } from '@tanstack/react-query';

export function useOpenLogs() {
  return useMutation({
    mutationFn: () => globalThis.window.electron.openLogs(),
  });
}
