const ICON_CATALOG: Record<string, HTMLElement> = {};

export function icon(name: string): Element | undefined {
  let icon = ICON_CATALOG[name];

  if (!icon) {
    let markup: string | undefined;
    switch (name) {
      case 'checkmark':
        markup = `<span aria-hidden="true" class="ui-checkmark"><svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M435.848 83.466L172.804 346.51l-96.652-96.652c-4.686-4.686-12.284-4.686-16.971 0l-28.284 28.284c-4.686 4.686-4.686 12.284 0 16.971l133.421 133.421c4.686 4.686 12.284 4.686 16.971 0l299.813-299.813c4.686-4.686 4.686-12.284 0-16.971l-28.284-28.284c-4.686-4.686-12.284-4.686-16.97 0z"></path></svg>
      </span>`;
        break;
      case 'trailing-chevron':
        markup = `<span aria-hidden="true" class="ui-trailing-chevron"><svg focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg></span>`;
        break;
      case 'mixed-mark':
        markup =
          '<span aria-hidden="true" class="ui-mixed-mark"><svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 512 512"><path fill="currentColor" d="M0 256c0-13.3 10.7-24 24-24H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24z"/></svg></span>';
    }

    if (markup) {
      const template = document.createElement('template');
      template.innerHTML = markup;
      ICON_CATALOG[name] = template;
      icon = template;
    }
  }

  if (icon) {
    if ('content' in icon)
      return (icon as HTMLTemplateElement).content.cloneNode(true) as Element;
    const element = document.createElement('svg');
    element.innerHTML = icon.innerHTML;
    return element;
  }

  return undefined;
}
