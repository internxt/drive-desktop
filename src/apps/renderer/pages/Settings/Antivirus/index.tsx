import { useState } from 'react';
import { useAntivirus } from '../../../hooks/antivirus/useAntivirus';
import Button from '../../../components/Button';

interface AntivirusSectionProps {
  active: boolean;
}

export default function AntivirusSection({ active }: AntivirusSectionProps) {
  const { selectItemsToScan, scanSingleDir } = useAntivirus();
  const [selectedItems, setSelectedItems] = useState<{
    path: string;
    itemName: string;
  }>();

  const onSelectItemsButtonClicked = async () => {
    const selectedItems = await selectItemsToScan();
    if (selectedItems) {
      setSelectedItems(selectedItems as any);
    }
  };

  return (
    <div className={`${active ? 'block' : 'hidden'} w-full`}>
      <section className="flex h-full">
        <div className="mx-4 items-center justify-center">
          <Button onClick={onSelectItemsButtonClicked}>Select items</Button>
        </div>
      </section>
    </div>
  );
}
