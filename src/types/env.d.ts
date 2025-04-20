import { TEnv } from '.erb/scripts/validate-process-env';

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends TEnv {}
  }
}

export {};
