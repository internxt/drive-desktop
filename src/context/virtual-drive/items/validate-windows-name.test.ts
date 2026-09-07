import { mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as addSyncIssue from '@/apps/main/background-processes/issues';
import { validateWindowsName } from './validate-windows-name';

describe('validate-windows-name', () => {
  partialSpyOn(addSyncIssue, 'addSyncIssue');

  function getProps({ name }: { name: string }) {
    return mockProps<typeof validateWindowsName>({ name });
  }

  it('should return true when the name is valid', () => {
    const result = validateWindowsName(getProps({ name: 'test' }));
    expect(result.isValid).toBe(true);
  });

  it('should return false when the name includes \\', () => {
    const result = validateWindowsName(getProps({ name: String.raw`\test` }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes /', () => {
    const result = validateWindowsName(getProps({ name: '/test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes :', () => {
    const result = validateWindowsName(getProps({ name: ':test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes *', () => {
    const result = validateWindowsName(getProps({ name: '*test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes ?', () => {
    const result = validateWindowsName(getProps({ name: '?test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes "', () => {
    const result = validateWindowsName(getProps({ name: '"test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes <', () => {
    const result = validateWindowsName(getProps({ name: '<test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes >', () => {
    const result = validateWindowsName(getProps({ name: '>test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes |', () => {
    const result = validateWindowsName(getProps({ name: '|test' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes a tab', () => {
    const result = validateWindowsName(getProps({ name: 'Screams\tby A SOUND EFFECT' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name includes a line break', () => {
    const result = validateWindowsName(getProps({ name: 'Doc\numento' }));
    expect(result.isValid).toBe(false);
  });

  it('should return false when the name ends with empty space', () => {
    const result = validateWindowsName(getProps({ name: 'test ' }));
    expect(result.isValid).toBe(false);
  });

  /**
   * BR-2245
   * Win32 trims trailing dots the same way it trims trailing spaces, so the item ends up
   * unreachable for explorer even though we could create it.
   */
  it('should return false when the name ends with a dot', () => {
    const result = validateWindowsName(getProps({ name: 'Press U.S.' }));
    expect(result.isValid).toBe(false);
  });

  /**
   * BR-2245
   * A leading space survives win32 parsing, so rejecting it was skipping the folder and every
   * item below it for nothing.
   */
  it('should return true when the name starts with empty space', () => {
    const result = validateWindowsName(getProps({ name: ' test' }));
    expect(result.isValid).toBe(true);
  });

  it('should return true for a reserved device name', () => {
    const result = validateWindowsName(getProps({ name: 'CON' }));
    expect(result.isValid).toBe(true);
  });
});
