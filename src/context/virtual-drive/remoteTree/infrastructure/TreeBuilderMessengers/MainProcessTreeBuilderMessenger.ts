import { addVirtualDriveIssue } from '../../../../../apps/main/issues/virtual-drive';
import { TreeBuilderMessenger } from '../../domain/TreeBuilderMessenger';

export class MainProcessTreeBuilderMessenger implements TreeBuilderMessenger {
  async duplicatedNode(name: string): Promise<void> {
    addVirtualDriveIssue({
      error: 'GENERATE_TREE',
      cause: 'DUPLICATED_NODE',
      name: name,
    });
  }
}
