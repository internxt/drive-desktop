type TBody = {
  msg: string;
  [key: string]: unknown;
};

export type TLogger = {
  debug: (body: TBody) => void;
  warn: (body: TBody) => void;
  error: (body: TBody) => void;
};
