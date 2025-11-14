import { FormatParams } from 'electron-log';

import { convertUTCDateToGMT2 } from './convert-utc-date-to-gmt2';

export function logFormatter(message: FormatParams) {
  return [`[${convertUTCDateToGMT2(message.message.date)}]`, ...message.data];
}
