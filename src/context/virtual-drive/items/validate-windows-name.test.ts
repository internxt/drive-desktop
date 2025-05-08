import { mockProps } from 'tests/vitest/utils.helper.test';
import { validateWindowsName } from './validate-windows-name';

vi.mock(import('@/apps/sync-engine/ipcRendererSyncEngine'));

describe('validate-windows-name', () => {
  function getProps({ name }: { name: string }) {
    return mockProps<typeof validateWindowsName>({ name });
  }

  it('Should return true when the name is valid', () => {
    const result = validateWindowsName(getProps({ name: 'test' }));
    expect(result.isValid).toBe(true);
  });

  it('Should return false when the name includes \\', () => {
    const result = validateWindowsName(getProps({ name: '\\test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes /', () => {
    const result = validateWindowsName(getProps({ name: '/test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes :', () => {
    const result = validateWindowsName(getProps({ name: ':test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes *', () => {
    const result = validateWindowsName(getProps({ name: '*test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes ?', () => {
    const result = validateWindowsName(getProps({ name: '?test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes "', () => {
    const result = validateWindowsName(getProps({ name: '"test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes <', () => {
    const result = validateWindowsName(getProps({ name: '<test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes >', () => {
    const result = validateWindowsName(getProps({ name: '>test' }));
    expect(result.isValid).toBe(false);
  });

  it('Should return false when the name includes |', () => {
    const result = validateWindowsName(getProps({ name: '|test' }));
    expect(result.isValid).toBe(false);
  });
});
