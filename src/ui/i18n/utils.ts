export function getComputedDir(element: HTMLElement): 'ltr' | 'rtl' {
  if (element.dir && element.dir !== 'auto')
    return element.dir as 'ltr' | 'rtl';

  if (element.parentElement) return getComputedDir(element.parentElement);
  return 'ltr';
}
