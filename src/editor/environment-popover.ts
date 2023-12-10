import { CasesEnvironment, MatrixEnvironment } from '../public/core-types';
import {
  isAlignEnvironment,
  isCasesEnvironment,
  isMatrixEnvironment,
  isTabularEnvironment,
} from '../latex-commands/environment-types';
import { SelectorPrivate } from './types';
import {
  getSharedElement,
  releaseSharedElement,
} from '../common/shared-element';

import { injectStylesheet, releaseStylesheet } from '../common/stylesheet';
import { _Mathfield } from 'editor-mathfield/mathfield-private';

const padding = 4;
const radius = 20;
const paddedWidth = 2 * (radius + padding);

const newPlus = (x, y) => `
  <line x1="${x + radius}" y1="${y + radius}" 
    x2="${x > y ? x + radius : 7 * radius + 10 * padding}" 
    y2="${x < y ? y + radius : 7 * radius + 10 * padding}"/>
  <svg id="plus" viewBox="0 0 40 40" x="${x}" y="${y}" width="40" height="40">
    <circle class="cls-2" cx="20" cy="20" r="20"/>
    <path class="font" d="m33.33,20c0,1.84-1.49,3.34-3.33,3.34h-6.67v6.66c0,1.84-1.49,3.34-3.33,3.34s-3.34-1.5-3.34-3.34v-6.66h-6.66c-1.84,0-3.34-1.5-3.34-3.34s1.5-3.33,3.34-3.33h6.66v-6.67c0-1.84,1.5-3.33,3.34-3.33s3.33,1.49,3.33,3.33v6.67h6.67c1.84,0,3.33,1.49,3.33,3.33Z"/>
  </svg>`;

const newMinus = (x, y) => `
  <line x1="${x + radius}" y1="${y + radius}" 
    x2="${x > y ? x + radius : 7 * radius + 10 * padding}" 
    y2="${x < y ? y + radius : 7 * radius + 10 * padding}"/>
  <svg id="minus" viewBox="0 0 40 40" x="${x}" y="${y}" width="40" height="40">
    <circle class="cls-2" cx="20" cy="20" r="20"/>
    <path class="font" d="m33.33,20c0,1.84-1.49,3.33-3.33,3.33H10c-1.84,0-3.34-1.49-3.34-3.33s1.5-3.34,3.34-3.34h20c1.84,0,3.33,1.5,3.33,3.34Z"/>
  </svg>`;

const newArrow = (x, y, theta) => `
  <svg id="arrow" viewBox="0 0 40 40" x="${x}" y="${y}" width="40" height="40">
    <circle class="cls-2" cx="20" cy="20" r="20"/>
    <g transform="rotate(${theta})" transform-origin="20 20">
      <path class="font" d="m17.7,7.23h4.6c.52,0,.94.42.94.94v13.82c0,.52.42.94.94.94h3.39c.83,0,1.25,1.01.66,1.6l-7.56,7.56c-.37.37-.96.37-1.32,0l-7.56-7.56c-.59-.59-.17-1.6.66-1.6h3.39c.52,0,.94-.42.94-.94v-13.82c0-.52.42-.94.94-.94Z"/>
    </g>  
  </svg>`;

const controllerSvg = `
<svg class="MLEP__array-buttons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
viewBox=
"-2 -2 ${8 * radius + 10 * padding + 5} ${8 * radius + 10 * padding + 5}">
  <rect 
      class="MLEP__array-insert-background rows"
      x="0" 
      y="${paddedWidth + padding}" 
      height="${3 * paddedWidth}" 
      width="${paddedWidth}" 
      rx="${paddedWidth / 2}"/>
      <rect 
      class="MLEP__array-insert-background columns"
      x="${paddedWidth + padding}" 
      y="0" 
      height="${paddedWidth}" 
      width="${3 * paddedWidth}" 
      rx="${paddedWidth / 2}"/>
  <g data-command='"moveDown"'>
  ${newArrow(2 * (padding + paddedWidth), 2 * padding + 3 * paddedWidth, 0)}
  </g>
  <g data-command='"moveUp"'>
  ${newArrow(2 * (padding + paddedWidth), 2 * padding + paddedWidth, 180)}
  </g>
  <g data-command='"moveToNextWord"'>
  ${newArrow(2 * padding + 3 * paddedWidth, 2 * (padding + paddedWidth), -90)}
  </g>
  <g data-command='"moveToPreviousWord"'>
  ${newArrow(2 * padding + paddedWidth, 2 * (padding + paddedWidth), 90)}
  </g>
  <g>

  <g data-command='"addColumnBefore"'>
  ${newPlus(2 * padding + paddedWidth, padding)}
  </g>
  <g data-command='"removeColumn"'>
  ${newMinus(2 * padding + 2 * paddedWidth, padding)}
  </g>
  <g data-command='"addColumnAfter"'>
  ${newPlus(2 * padding + 3 * paddedWidth, padding)}
  </g>
  <g data-command='"addRowBefore"'>
  ${newPlus(padding, 2 * padding + paddedWidth)}
  </g>
  <g data-command='"removeRow"'>
  ${newMinus(padding, 2 * padding + 2 * paddedWidth)}
  </g>
  <g data-command='"addRowAfter"'>
    ${newPlus(padding, 2 * padding + 3 * paddedWidth)}
  </g>
</svg>`;

type svgBuilder = (className: string) => string;

const matrix: svgBuilder = (className) => `
<svg id="matrix" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","matrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/></svg>`;

const pmatrix: svgBuilder = (className) => `
<svg id="pmatrix" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
data-command='["setEnvironment","pmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m6,4c-3.96,4.6-3.96,11.4,0,16"/>
  <path class="cls-2" d="m22,4c3.96,4.6,3.96,11.4,0,16"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/></svg>`;

const Bmatrix: svgBuilder = (className) => `
<svg id="Bmatrix" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","Bmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m6,4c-1.1,0-2,.9-2,2v3c0,1.66-.9,3-2,3,1.1,0,2,1.34,2,3v3c0,1.1.9,2,2,2"/>
  <path class="cls-2" d="m22,4c1.1,0,2,.9,2,2v3c0,1.66.9,3,2,3-1.1,0-2,1.34-2,3v3c0,1.1-.9,2-2,2"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
</svg>`;

const bmatrix: svgBuilder = (className) => `
<svg id="bmatrix" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","bmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m6,4h-3v16h3"/>
  <path class="cls-2" d="m22,4h3v16h-3"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
</svg>`;

const vmatrix: svgBuilder = (className) => `
<svg id="vmatrix" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","vmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
  <line class="cls-2" x1="4" y1="4" x2="4" y2="20"/>
  <line class="cls-2" x1="24" y1="4" x2="24" y2="20"/>
</svg>`;

const Vmatrix: svgBuilder = (className) => `
<svg id="Vmatrix" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="-3.5 -3 35 30" 
  data-command='["setEnvironment","Vmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
  <line class="cls-2" x1="6" y1="4" x2="6" y2="20"/>
  <line class="cls-2" x1="22" y1="4" x2="22" y2="20"/>
  <line class="cls-2" x1="2" y1="4" x2="2" y2="20"/>
  <line class="cls-2" x1="26" y1="4" x2="26" y2="20"/>
</svg>`;

const cases: svgBuilder = (className) => `
<svg id="cases" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","cases"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m10,4c-1.1,0-2,.9-2,2v3c0,1.66-.9,3-2,3,1.1,0,2,1.34,2,3v3c0,1.1.9,2,2,2"/>
  <circle cx="13" cy="8" r="1"/>
  <circle cx="13" cy="16" r="1"/>
  <circle cx="21" cy="8" r="1"/>
  <circle cx="21" cy="16" r="1"/>
</svg>`;

const rcases: svgBuilder = (className) => `
<svg id="rcases" class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","rcases"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m18,20c1.1,0,2-.9,2-2v-3c0-1.66.9-3,2-3-1.1,0-2-1.34-2-3v-3c0-1.1-.9-2-2-2"/>
  <circle cx="15" cy="8" r="1"/>
  <circle cx="15" cy="16" r="1"/>
  <circle cx="7" cy="8" r="1"/>
  <circle cx="7" cy="16" r="1"/>
</svg>`;

const matrixButtons = { matrix, pmatrix, bmatrix, Bmatrix, vmatrix, Vmatrix };
const casesButtons = { cases, rcases, Bmatrix };

export function showEnvironmentPopover(mf: _Mathfield): void {
  const array = mf.model.parentEnvironment?.array;
  if (!array) return;

  let columnCount = 0;
  array.forEach((column) => {
    if (!columnCount || column.length > columnCount)
      columnCount = column.length;
  });
  //@TODO: display current matrix dimensions

  let panel = document.getElementById('mathlive-environment-popover');
  if (!panel) {
    panel = getSharedElement('mathlive-environment-popover');

    injectStylesheet('environment-popover');
    injectStylesheet('core');

    panel.setAttribute('aria-hidden', 'true');
  }

  let flexbox;
  const possiblyExistentFlexbox = panel.querySelector(
    '.MLEP__environment-controls'
  );
  if (possiblyExistentFlexbox) flexbox = possiblyExistentFlexbox;
  else {
    flexbox = document.createElement('div');
    panel.innerHTML = '';
    panel.appendChild(flexbox);
  }
  flexbox.className = 'MLEP__environment-controls';
  flexbox.style.display = 'flex';
  flexbox.style.width = '100%';
  flexbox.style.height = '100%';
  flexbox.style.boxSizing = 'border-box';

  flexbox.innerHTML = controllerSvg;

  let delimiterOptions: string[] = [];
  let activeDelimeter = '';

  const environment = mf.model.parentEnvironment.environmentName;

  // 3 button modes: matrix, cases, and align/gather
  if (isMatrixEnvironment(environment)) {
    const normalizedEnvironment = normalizeMatrixName(environment);
    activeDelimeter = matrixButtons[normalizedEnvironment]('active');
    const { [normalizedEnvironment]: _, ...filteredDelimeters } = matrixButtons;
    delimiterOptions = Object.values(filteredDelimeters).map((f: svgBuilder) =>
      f('inactive')
    );
  } else if (isCasesEnvironment(environment)) {
    const normalizedEnvironment = normalizeCasesName(environment);
    activeDelimeter = casesButtons[normalizedEnvironment]('active');
    const { [normalizedEnvironment]: _, ...filteredDelimeters } = casesButtons;
    delimiterOptions = Object.values(filteredDelimeters).map((f: svgBuilder) =>
      f('inactive')
    );
  } else if (isAlignEnvironment(environment)) {
    activeDelimeter = matrixButtons['matrix']('active');
    delimiterOptions = Object.values(casesButtons).map((f: svgBuilder) =>
      f('inactive')
    );
  }

  const delimiterControls = document.createElement('div');
  delimiterControls.className = 'MLEP__environment-delimiter-controls';
  delimiterControls.style.display = 'flex';
  delimiterControls.style.flexDirection = 'column';

  delimiterControls.innerHTML = `
  <div class='MLEP__array-delimiter-options'>
  ${activeDelimeter}
  ${delimiterOptions.join('')}
  </div>`;

  // If we're in cases or matrix, show the delimiter controls
  if (activeDelimeter) flexbox.appendChild(delimiterControls);
  const arrayControls = flexbox.querySelectorAll(
    '[data-command]'
  ) as NodeListOf<SVGSVGElement>;

  arrayControls.forEach((control) => {
    const commandString = control.dataset.command!;
    let command: SelectorPrivate | [SelectorPrivate, ...any[]] =
      commandString as SelectorPrivate;
    try {
      command = JSON.parse(commandString);
    } catch (e) {
      // just a string command
    }
    control.addEventListener('mousedown', (ev) => ev.preventDefault());
    if (command)
      control.addEventListener('click', () => mf.executeCommand(command));
  });

  const position = mf.field?.getBoundingClientRect();
  if (position) {
    panel.style.top = `${
      window.scrollY + (position.top - panel.clientHeight - 15)
    }px`;
    panel.style.left = `${position.left + 20}px`;
    panel.classList.add('is-visible');
  }
}

export function hideEnvironmentPopover(): void {
  // return;
  const panel = document.getElementById('mathlive-environment-popover');
  panel?.classList.remove('is-visible');
}

export function disposeEnvironmentPopover(): void {
  if (!document.getElementById('mathlive-environment-popover')) return;
  releaseSharedElement('mathlive-environment-popover');
  releaseStylesheet('environment-popover');
  releaseStylesheet('core');
}

export function environmentPopoverIsVisible(): boolean {
  const panel = document.getElementById('mathlive-environment-popover');
  if (!panel) return false;
  return panel.classList.contains('is-visible');
}

export function updateEnvironmentPopover(mf: _Mathfield): void {
  if (!mf.hasFocus()) return;
  let visible = false;
  if (mf.model.mode === 'math') {
    const env = mf.model.parentEnvironment;
    if (!!env?.array && isTabularEnvironment(env.environmentName)) {
      // The focus is inside a tabular environment
      const policy = mf.options.environmentPopoverPolicy;
      visible = policy === 'auto' || policy === 'on';
    }
  }
  if (visible) showEnvironmentPopover(mf);
  else hideEnvironmentPopover();
}

const normalizedMatrices = [
  'matrix',
  'pmatrix',
  'bmatrix',
  'Bmatrix',
  'vmatrix',
  'Vmatrix',
] as const;

function normalizeMatrixName(environment: MatrixEnvironment) {
  return environment.replace('*', '') as (typeof normalizedMatrices)[number];
}

const normalizedCases = ['cases', 'rcases'] as const;
function normalizeCasesName(environment: CasesEnvironment) {
  if (environment === 'dcases')
    return 'cases' as (typeof normalizedCases)[number];
  return environment as (typeof normalizedCases)[number];
}
