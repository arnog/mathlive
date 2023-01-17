import type { Releasable } from './releasable';
import { throwIfNotInBrowser } from './capabilities';

export type Stylesheet = Releasable;

export function inject(
  element: HTMLElement | null,
  css: string,
  id: string
): null | Releasable {
  throwIfNotInBrowser();

  if (!css) return null;

  let root = element?.getRootNode() ?? document?.head;

  if (!root) return null;
  if (root === document) root = document.head;

  const element_ = (root as HTMLElement).querySelector<HTMLElement>(
    `style[data-id="${id}"]`
  );
  if (element_) {
    const refCount = Number.parseFloat(
      element_.getAttribute('data-refcount') ?? '0'
    );
    element_.dataset.refcount = Number(refCount + 1).toString();
  } else {
    // Make a new node holding the stylesheet
    const styleNode = document.createElement('style');
    // StyleNode.setAttribute('media', 'screen')
    // styleNode.setAttribute('media', 'only screen and (max-width : 1024px)')
    styleNode.dataset.id = id;
    styleNode.dataset.refcount = '1';
    styleNode.append(document.createTextNode(css));
    root.appendChild(styleNode);
  }

  return {
    release: (): void => {
      const element_ = (root as HTMLElement).querySelector<HTMLElement>(
        `style[data-id="${id}"]`
      );
      if (element_) {
        const refCount = Number.parseFloat(
          element_.getAttribute('data-refcount') ?? '0'
        );
        if (refCount === 1) element_.remove();
        else element_.dataset.refcount = Number(refCount - 1).toString();
      }
    },
  };
}
