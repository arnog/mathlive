import { ArrayAtom } from 'core-atoms/array';
import { Environment } from 'core-definitions/environments';
import { Scrim } from 'editor/scrim';
import { VirtualKeyboard } from './virtual-keyboard';

const plus = `
  <circle class='MLK__array-button-background' cx="10" cy="10" r="10"/>
  <path class='MLK__array-button' fill="#999" d="m10,2C5.58,2,2,5.58,2,10s3.58,8,8,8,8-3.58,8-8S14.42,2,10,2Zm4,9.25h-2.75v2.75c0,.69-.56,1.25-1.25,1.25s-1.25-.56-1.25-1.25v-2.75h-2.75c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25h2.75v-2.75c0-.69.56-1.25,1.25-1.25s1.25.56,1.25,1.25v2.75h2.75c.69,0,1.25.56,1.25,1.25s-.56,1.25-1.25,1.25Z"/>
</svg>`;

const smallplus = `
<svg class="MLK__array-plus small" xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 40 40">
  <circle class='MLK__array-button-background' cx="10" cy="10" r="10"/>
  <path class='MLK__array-button' fill="#999" d="m10,2C5.58,2,2,5.58,2,10s3.58,8,8,8,8-3.58,8-8S14.42,2,10,2Zm4,9.25h-2.75v2.75c0,.69-.56,1.25-1.25,1.25s-1.25-.56-1.25-1.25v-2.75h-2.75c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25h2.75v-2.75c0-.69.56-1.25,1.25-1.25s1.25.56,1.25,1.25v2.75h2.75c.69,0,1.25.56,1.25,1.25s-.56,1.25-1.25,1.25Z"/>
</svg>`;

const minus = `
<svg class="MLK__array-minus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <circle class='MLK__array-button-background' cx="10" cy="10" r="10"/>
  <path class='MLK__array-button' fill="#999" d="m10,2C5.58,2,2,5.58,2,10s3.58,8,8,8,8-3.58,8-8S14.42,2,10,2Zm4,9.25H6c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25h8c.69,0,1.25.56,1.25,1.25s-.56,1.25-1.25,1.25Z"/>
</svg>`;

const navigatorSVG = `
<svg class="MLK__array-navigator" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect class="MLK__array-navigator-center" rx="1" x="8" y="8" width="8" height="8"/>

  <rect class="MLK__array-arrow left" y="8" x="0" height="8" width="8" fill-opacity="0"/>
  <path class="MLK__array-arrow left" d="m1,8c-.55,0-1,.45-1,1v6c0,.55.45,1,1,1h7v-8H1Zm5.84,4.72h-3.49v1.47l-2.19-2.19,2.19-2.19v1.47h3.49v1.44Z"/>

  <rect class="MLK__array-arrow up" x="8" y="0" height="8" width="8" fill-opacity="0"/> 
  <path class="MLK__array-arrow up" d="m15,0h-6c-.55,0-1,.45-1,1v7h8V1c0-.55-.45-1-1-1Zm-2.28,3.35v3.49h-1.44v-3.49h-1.47l2.19-2.19,2.19,2.19h-1.47Z"/>

  <rect class="MLK__array-arrow right" x="16" y="8" height="8" width="8" fill-opacity="0"/>
  <path class="MLK__array-arrow right" d="m23,8h-7v8h7c.55,0,1-.45,1-1v-6c0-.55-.45-1-1-1Zm-2.35,6.19v-1.47h-3.49v-1.44h3.49v-1.47l2.19,2.19-2.19,2.19Z"/>

  <rect class="MLK__array-arrow down" y="16" x="8" height="8" width="8" fill-opacity="0"/>
  <path class="MLK__array-arrow down" d="m8,16v7c0,.55.45,1,1,1h6c.55,0,1-.45,1-1v-7h-8Zm4,6.84l-2.19-2.19h1.47v-3.49h1.44v3.49h1.47l-2.19,2.19Z"/>
</svg>`;

export function showEnvironmentPanel(
  keyboard: VirtualKeyboard,
  arrayAt: ArrayAtom,
  bounds: DOMRect
): void {
  hideEnvironmentPanel();
  const array = (arrayAt as ArrayAtom).array;

  let columnCount = 0;
  const rowCount = array.length;
  array.forEach((column) => {
    if (!columnCount || column.length > columnCount)
      columnCount = column.length;
  });

  const environmentPanel = document.createElement('div');
  environmentPanel.setAttribute('aria-hidden', 'true');
  environmentPanel.className = 'MLK__environment-panel';

  console.log(keyboard.container?.querySelector('.ML__keyboard'));
  if (!Scrim.scrim) Scrim.scrim = new Scrim();
  Scrim.scrim.open({
    root: keyboard.container?.querySelector('.ML__keyboard'),
    child: environmentPanel,
    zIndex: 3,
  });

  let navigator = ``;

  let flexbox = document.createElement('div');
  flexbox.className = 'MLK__environment-controls';
  flexbox.style.display = 'flex';
  flexbox.style.width = '100%';
  flexbox.style.height = '100%';
  flexbox.style.padding = '4px';
  flexbox.style.boxSizing = 'border-box';

  flexbox.innerHTML = `
  <div class="MLK__row-controls"> 
    <svg class="MLK__array-plus" xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 40 40">${plus}</svg>
    <svg class="MLK__array-minus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${minus}</svg>
    <svg class="MLK__array-plus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${plus}</svg>
  </div>
  <div class='MLK__column-controls'> 
    <svg class="MLK__array-plus" xmlns="http://www.w3.org/2000/svg" viewBox="-20 0 40 40">${plus}</svg>
    <svg class="MLK__array-minus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${minus}</svg>
    <svg class="MLK__array-plus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${plus}</svg>
    ${navigatorSVG}
  </div>
  <p class="MLK__environment-dimensions">${rowCount + '×' + columnCount}</p>`;

  environmentPanel.appendChild(flexbox);

  const rowControls = flexbox
    .querySelector('.MLK__row-controls')
    ?.querySelectorAll('svg');

  rowControls?.forEach((svg) => {
    if (svg.classList.contains('MLK__array-plus')) {
      svg.addEventListener('mousedown', preventDefault);

      if (svg.classList.contains('small')) {
        svg.addEventListener('click', (e) => {
          console.log(keyboard);
          keyboard.executeCommand('addRowBefore');
        });
      } else {
        svg.addEventListener('click', (e) =>
          keyboard.executeCommand('addRowAfter')
        );
      }
    } else if (svg.classList.contains('MLK__array-minus')) {
      svg.addEventListener('mousedown', preventDefault);
      svg.addEventListener('click', (e) =>
        keyboard.executeCommand('removeRow')
      );
    }
  });

  const position = bounds;

  if (position) {
    const left = position.left;
    const top = position.top - environmentPanel.clientHeight - 25;
    environmentPanel.style.transform = `translate(${left}px, ${top}px)`;
    environmentPanel.classList.add('is-visible');
  }

  return;
}

export function hideEnvironmentPanel(): void {
  Scrim.scrim?.close();
}

const preventDefault = (e: MouseEvent) => e.preventDefault();
