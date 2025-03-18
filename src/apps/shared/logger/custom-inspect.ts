import { inspect } from 'util';

export const customInspect = (obj: unknown) => inspect(obj, { colors: true, depth: Infinity, breakLength: Infinity });
