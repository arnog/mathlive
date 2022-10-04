export function reevaluateBreakpoints(kbd: HTMLElement): void {
  const { width } = kbd.getBoundingClientRect();
  kbd.classList.remove(
    'container-xxxs',
    'container-xxs',
    'container-xs',
    'container-sm',
    'container-md',
    'container-lg'
  );

  if (width < 320) kbd.classList.add('container-xxxs');
  else if (width <= 414) kbd.classList.add('container-xxs');
  else if (width <= 628) kbd.classList.add('container-xs');
  else if (width <= 767) kbd.classList.add('container-sm');
  else if (width <= 1024) kbd.classList.add('container-md');
  else kbd.classList.add('container-lg');
}
