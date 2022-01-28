import Header from './Header';
import SyncAction from './SyncAction';
import SyncErrorBanner from './SyncErrorBanner';
import SyncInfo from './SyncInfo';

export default function Widget() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <SyncErrorBanner />
      <SyncInfo />
      <SyncAction />
    </div>
  );
}
