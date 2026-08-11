const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const HAS_LOWERCASE = /[a-z]/;

export const isComponentName = (name: string): boolean =>
  PASCAL_CASE.test(name) && HAS_LOWERCASE.test(name);

export const componentBaseName = (filename: string): string => {
  const base = filename.split(/[\\/]/).pop() ?? '';
  return base.replace(/\.[^.]+$/, '');
};
