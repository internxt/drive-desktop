import { DiscoverBackups } from './Banners/DiscoverBackups';
import { NautilusUnavailable } from './Banners/NautilusUnavailable';
import { UpdateAvailable } from './Banners/UpdateAvailable';

export function InfoBanners() {
  return (
    <>
      <NautilusUnavailable />
      <UpdateAvailable />
      <DiscoverBackups />
    </>
  );
}
