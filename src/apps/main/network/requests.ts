export type FileInfo = {
  bucket: string;
  mimetype: string;
  filename: string;
  frame: string;
  size: number;
  id: string;
  created: Date;
  hmac: {
    value: string;
    type: string;
  };
  erasure?: {
    type: string;
  };
  index: string;
};

export type NetworkCredentials = {
  user: string;
  pass: string;
};

export type Mirror = {
  index: number;
  replaceCount: number;
  hash: string;
  size: number;
  parity: boolean;
  token: string;
  healthy?: boolean;
  farmer: {
    userAgent: string;
    protocol: string;
    address: string;
    port: number;
    nodeID: string;
    lastSeen: Date;
  };
  url: string;
  operation: string;
};
