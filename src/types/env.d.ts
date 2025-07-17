import { TEnv } from '.erb/scripts/validate-process-env';

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface ProcessEnv extends TEnv {}
  }
}

export {};
