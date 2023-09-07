import { App, app } from 'electron';

import { AvaliableMethods } from './AvaliableAppQuery';

export type AppQuery<T extends AvaliableMethods> = {
  method: string;
  params: Parameters<App[T]>;
};

export const executeQuery = ({
  method,
  params = [],
}: AppQuery<AvaliableMethods>): ReturnType<App[AvaliableMethods]> => {
  app.getPreferredSystemLanguages();
  const fn = app[method as AvaliableMethods];

  return params.length === 0 ? fn() : fn(...params);
};
