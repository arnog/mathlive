export function getSharedElement(id: string): HTMLElement {
  let result = document.getElementById(id);
  if (result) {
    result.dataset.refcount = Number(
      Number.parseInt(result.dataset.refcount ?? '0') + 1
    ).toString();
  } else {
    result = document.createElement('div');
    result.setAttribute('aria-hidden', 'true');
    result.dataset.refcount = '1';
    result.id = id;
    document.body.append(result);
  }

  return result;
}

export function releaseSharedElement(id: string): void {
  const element = document.getElementById(id);
  if (!element) return;
  const refcount = Number.parseInt(
    element.getAttribute('data-refcount') ?? '0'
  );
  if (refcount <= 1) element.remove();
  else element.dataset.refcount = Number(refcount - 1).toString();
}
