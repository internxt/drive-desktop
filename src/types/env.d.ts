import { TEnv } from '.erb/scripts/validate-process-env';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends TEnv {}
  }
}

export {};
