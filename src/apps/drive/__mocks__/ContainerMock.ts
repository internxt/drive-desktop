import { Container, Identifier } from 'diod';

export class ContainerMock implements Partial<Container> {
  private services = new Map();

  get = vi.fn((service) => this.services.get(service));

  set<T>(service: any, implementation: T): void {
    this.services.set(service, implementation);
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findTaggedServiceIdentifiers<T = unknown>(tag: string): Array<Identifier<T>> {
    return [] as Array<Identifier<T>>;
  }
}
