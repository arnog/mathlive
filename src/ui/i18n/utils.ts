export function getComputedDir(element: HTMLElement): 'ltr' | 'rtl' {
  const dir = getComputedStyle(element).direction;
  return dir === 'ltr' || dir === 'rtl' ? dir : 'ltr';
}
