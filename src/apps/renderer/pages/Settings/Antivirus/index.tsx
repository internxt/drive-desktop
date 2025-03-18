import { LockedState } from './views/LockedState';
import { ChooseItemsState } from './views/ChooseItemsState';
import { ScanState } from './views/ScanState';
import { LoadingState } from './views/LoadingState';
import { Views } from '../../../hooks/antivirus/useAntivirus';
import { useAntivirusContext } from '../../../context/AntivirusContext';

interface AntivirusSectionProps {
  active: boolean;
  showItemsWithMalware: () => void;
}

export default function AntivirusSection({
  active,
  showItemsWithMalware,
}: AntivirusSectionProps): JSX.Element {
  const { view } = useAntivirusContext();

  const viewStates: Record<Views, JSX.Element> = {
    loading: <LoadingState />,
    locked: <LockedState />,
    chooseItems: <ChooseItemsState />,
    scan: <ScanState showItemsWithMalware={showItemsWithMalware} />,
  };

  return (
    <section
      className={`${active ? 'block' : 'hidden'} relative h-full w-full`}
    >
      <div className="flex h-full w-full flex-col">{viewStates[view]}</div>
    </section>
  );
}
