const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

export const isComponentName = (name: string): boolean =>
  PASCAL_CASE.test(name);

export const componentBaseName = (filename: string): string => {
  const base = filename.split(/[\\/]/).pop() ?? '';
  return base.replace(/\.[^.]+$/, '');
};
