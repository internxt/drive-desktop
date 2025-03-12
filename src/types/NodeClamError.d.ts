declare module '@internxt/scan/lib/NodeClamError' {
  export default class NodeClamError extends Error {
    constructor(message: string);
    data?: {
      err?: Error;
      [key: string]: any;
    };
  }
}
