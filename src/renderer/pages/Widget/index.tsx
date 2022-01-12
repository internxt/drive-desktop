import Header from './Header';
import SyncInfo from './SyncInfo';

export default function Widget() {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />
      <SyncInfo />
    </div>
  );
}
