import { App, app } from 'electron';
import { AvaliableMethods } from './AvaliableAppQuery';

type OverridedApp = Omit<App, 'getPreferredSystemLanguages'> & {
  getPreferredSystemLanguages: () => Array<string>;
}

export type AppQuery<T extends AvaliableMethods> = {
  method: string;
  params: Parameters<OverridedApp[T]>;
};

export const executeQuery = ({
  method,
  params = [],
}: AppQuery<AvaliableMethods>): ReturnType<OverridedApp[AvaliableMethods]> => {
  const fn = (app as OverridedApp)[method as AvaliableMethods];

  return params.length === 0 ? fn() : fn(...params);
};
