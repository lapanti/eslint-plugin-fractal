import { describe, expect, it } from 'vitest';
import { componentBaseName, isComponentName } from '../src/utils/ast';

describe('isComponentName', () => {
  it.each(['Button', 'MyComponent', 'Ab'])(
    'returns true for PascalCase name "%s"',
    (name) => {
      expect(isComponentName(name)).toBe(true);
    },
  );

  it.each(['THIS_CONSTANT', 'API_URL'])(
    'returns false for SCREAMING_SNAKE_CASE constant "%s"',
    (name) => {
      expect(isComponentName(name)).toBe(false);
    },
  );

  it.each(['useHook', 'button'])(
    'returns false for lowercase-first name "%s"',
    (name) => {
      expect(isComponentName(name)).toBe(false);
    },
  );

  it.each(['URL', 'ID'])(
    'returns false for all-uppercase name with no lowercase letter "%s"',
    (name) => {
      expect(isComponentName(name)).toBe(false);
    },
  );

  it('returns false for an empty string', () => {
    expect(isComponentName('')).toBe(false);
  });
});

describe('componentBaseName', () => {
  it('strips the extension and takes the last path segment (posix)', () => {
    expect(componentBaseName('src/pages/Dashboard/Dashboard.tsx')).toBe(
      'Dashboard',
    );
  });

  it('strips the extension and takes the last path segment (windows)', () => {
    expect(componentBaseName('src\\pages\\Dashboard\\Dashboard.tsx')).toBe(
      'Dashboard',
    );
  });

  it('handles filenames with no directory', () => {
    expect(componentBaseName('Button.tsx')).toBe('Button');
  });
});
