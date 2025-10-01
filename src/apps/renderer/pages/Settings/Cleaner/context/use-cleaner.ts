import { useContext } from 'react';

export function useCleaner(): CleanerContextType {
  const ctx = useContext(CleanerContext);
  if (!ctx) throw new Error('useCleaner must be used inside <CleanerProvider>');
  return ctx;
}
