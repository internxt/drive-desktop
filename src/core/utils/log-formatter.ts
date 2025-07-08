import { LogMessage } from 'electron-log';
import { convertUTCDateToGMT2 } from './convert-UTC-date-to-GMT2';


export const logFormatter = (message: LogMessage) => {
  return [`[${convertUTCDateToGMT2(message.date)}]`, ...message.data];
};
