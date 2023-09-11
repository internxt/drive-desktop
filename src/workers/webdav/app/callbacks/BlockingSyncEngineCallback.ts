export interface BlockingSyncEngineCallback<Parameters> {
  execute: (params: Parameters, response: (result: boolean) => void) => void;
}
