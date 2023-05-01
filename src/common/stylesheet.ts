export function injectStylesheet(id: string, css: string): void {
  if (!css) return;

  const element_ = document.getElementById(id);
  if (element_) {
    const refCount = Number.parseInt(element_.dataset.refcount ?? '0');
    element_.dataset.refcount = Number(refCount + 1).toString();
  } else {
    // Make a new node holding the stylesheet
    const styleNode = document.createElement('style');
    // StyleNode.setAttribute('media', 'screen')
    // styleNode.setAttribute('media', 'only screen and (max-width : 1024px)')
    styleNode.id = id;
    styleNode.dataset.refcount = '1';
    styleNode.append(document.createTextNode(css));
    document.head.appendChild(styleNode);
  }
}

export function releaseStylesheet(id: string): void {
  const element_ = document.getElementById(id);
  if (!element_) return;
  const refCount = Number.parseInt(element_.dataset.refcount ?? '0');
  if (refCount <= 1) element_.remove();
  else element_.dataset.refcount = Number(refCount - 1).toString();
}
