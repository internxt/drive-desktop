import { RawUsage } from '../../../../main/usage/Usage';

export type MainProcessAccountMessages = {
  'account.get-usage': () => Promise<RawUsage>;
};
