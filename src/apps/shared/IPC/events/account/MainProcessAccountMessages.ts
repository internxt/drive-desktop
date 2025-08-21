import { RawUsage } from './../../../../../backend/features/usage/usage.types';
import { Result } from '../../../../../context/shared/domain/Result';


export type MainProcessAccountMessages = {
  'account.get-usage': () => Promise<Result<RawUsage, Error>>;
};
