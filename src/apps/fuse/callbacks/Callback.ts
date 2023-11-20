export type Callback = (code: number, params?: any) => void;

export type TypedCallback<T> = (code: number, params?: T) => void;
