import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { buildOperationsRouter } from './operations.routes';
import { OPERATION_PATHS } from '../constants';

describe('buildOperationsRouter', () => {
  let routes: string[];

  beforeEach(() => {
    const container = mockDeep<Container>();
    const router = buildOperationsRouter(container);
    routes = router.stack.filter((layer) => layer.route).map((layer) => layer.route!.path);
  });

  it('should register POST /getattributes', () => {
    expect(routes).toContain(OPERATION_PATHS.GET_ATTR);
    expect(routes).toContain(OPERATION_PATHS.CREATE);
    expect(routes).toContain(OPERATION_PATHS.WRITE);
    expect(routes).toContain(OPERATION_PATHS.RENAME);
  });

  it('should register POST /open', () => {
    expect(routes).toContain(OPERATION_PATHS.OPEN);
  });

  it('should register POST /opendir', () => {
    expect(routes).toContain(OPERATION_PATHS.OPEN_DIR);
  });

  it('should register POST /read', () => {
    expect(routes).toContain(OPERATION_PATHS.READ);
  });

  it('should register POST /release', () => {
    expect(routes).toContain(OPERATION_PATHS.RELEASE);
  });
});
