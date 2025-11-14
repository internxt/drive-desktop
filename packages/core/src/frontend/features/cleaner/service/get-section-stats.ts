import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { getSelectedItems } from './get-selected-items';

export type Selected = 'none' | 'partial' | 'all';
type Props = { viewModel: CleanerSectionViewModel; allItems: Array<{ fullPath: string }> };

export function getSectionStats({ viewModel, allItems }: Props) {
  const selectedItems = getSelectedItems({ viewModel, allItems });
  const selectedCount = selectedItems.length;
  const totalCount = allItems.length;

  let selected: Selected = 'partial';
  if (selectedCount === 0) selected = 'none';
  else if (selectedCount === totalCount) selected = 'all';

  return {
    selectedCount,
    totalCount,
    selected,
  };
}
