import { FormatParams } from 'electron-log';
import { convertUTCDateToGMT2 } from '@/core/utils/convertUTCDateToGMT2';

export const logFormatter = (message: FormatParams) => {
  return [`[${convertUTCDateToGMT2(message.message.date)}]`, ...message.data];
};
