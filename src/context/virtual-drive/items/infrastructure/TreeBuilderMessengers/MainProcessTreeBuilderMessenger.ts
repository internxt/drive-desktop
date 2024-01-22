import { addVirtualDriveIssue } from '../../../../../apps/main/issues/virtual-drive';
import { TreeBuilderMessenger } from '../../domain/TreeBuilderMessenger';

export class MainProcessTreeBuilderMessenger implements TreeBuilderMessenger {
  async duplicatedNode(name: string): Promise<void> {
    addVirtualDriveIssue({
      action: 'GENERATE_TREE',
      errorName: 'DUPLICATED_NODE',
      node: name,
    });
  }
}
