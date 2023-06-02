export abstract class DependencyContainerFactory<Container> {
  private container: Container | null = null;

  abstract create(): Promise<Container>;

  async build(): Promise<Container> {
    if (this.container) {
      return this.container;
    }

    this.container = await this.create();

    return this.container;
  }
}
