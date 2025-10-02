import { useContext } from 'react';
import { CleanerContext } from '../../../../context/CleanerContext';

export function useCleaner() {
  const ctx = useContext(CleanerContext);
  if (!ctx) throw new Error('useCleaner must be used inside <CleanerProvider>');
  return ctx;
}
