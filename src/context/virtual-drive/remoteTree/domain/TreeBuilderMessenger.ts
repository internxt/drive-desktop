export interface TreeBuilderMessenger {
  duplicatedNode(name: string): Promise<void>;
}
