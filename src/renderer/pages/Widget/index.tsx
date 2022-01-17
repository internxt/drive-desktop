import Header from './Header';
import SyncAction from './SyncAction';
import SyncErrorBanner from './SyncErrorBanner';
import SyncInfo from './SyncInfo';

export default function Widget() {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />
      <SyncErrorBanner />
      <SyncInfo />
      <SyncAction />
    </div>
  );
}
