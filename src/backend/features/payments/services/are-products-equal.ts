import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';


type Props = {
  stored: UserAvailableProducts | undefined;
  fetched: UserAvailableProducts;
};

export function areProductsEqual({ stored, fetched }: Props) {
  if (!stored) return false;

  return !!(
    stored.antivirus === fetched.antivirus &&
    stored.backups === fetched.backups &&
    stored.cleaner === fetched.cleaner
  );
}
