import { createContext, ReactNode, useContext } from 'react';
import {
  AntivirusContext as AntivirusContextType,
  useAntivirus,
} from '../hooks/antivirus/useAntivirus';

const AntivirusContext = createContext<AntivirusContextType | undefined>(
  undefined
);

export function AntivirusProvider({ children }: { children: ReactNode }) {
  const antivirusState = useAntivirus();

  return (
    <AntivirusContext.Provider value={antivirusState}>
      {children}
    </AntivirusContext.Provider>
  );
}

export function useAntivirusContext(): AntivirusContextType {
  const context = useContext(AntivirusContext);

  if (context === undefined) {
    throw new Error(
      'useAntivirusContext must be used within an AntivirusProvider'
    );
  }

  return context;
}
