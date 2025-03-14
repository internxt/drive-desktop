import { createContext, ReactNode, useContext } from 'react';
import { useAntivirus, UseAntivirusReturn } from '../hooks/antivirus/useAntivirus';

type AntivirusContext = UseAntivirusReturn;

export const AntivirusContext = createContext<AntivirusContext>({} as AntivirusContext);

export function AntivirusProvider({ children }: { children: ReactNode }) {
  const antivirus = useAntivirus();

  return (
    <AntivirusContext.Provider
      value={{
        ...antivirus,
      }}>
      {children}
    </AntivirusContext.Provider>
  );
}

export const useAntivirusContext = (): UseAntivirusReturn => {
  return useContext(AntivirusContext);
};
