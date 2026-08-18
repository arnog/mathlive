import type {
  EditToolbarOptions,
  AlphabeticKeyboardLayout,
  NormalizedVirtualKeyboardLayer,
  NormalizedVirtualKeyboardLayout,
  VirtualKeyboardKeycap,
  VirtualKeyboardLayout,
  VirtualKeyboardLayoutCore,
  VirtualKeyboardName,
} from '../public/virtual-keyboard';

import type {
  MathfieldProxy,
  VirtualKeyboardInterface,
  VirtualKeyboardMessage,
  VirtualKeyboardMessageAction,
} from '../public/virtual-keyboard';
import type { OriginValidator } from '../public/options';
import { MathfieldElement } from '../public/mathfield-element';

import { isTouchCapable } from '../ui/utils/capabilities';
import { isArray } from '../common/types';
import { validateOrigin } from '../editor-mathfield/utils';
import { getCommandTarget, COMMANDS, parseCommand } from '../editor/commands';
import { SelectorPrivate } from '../editor/types';

import { isVirtualKeyboardMessage, VIRTUAL_KEYBOARD_MESSAGE } from './proxy';
import {
  makeKeyboardElement,
  makeEditToolbar,
  releaseStylesheets,
  normalizeLayout,
  renderKeycap,
  normalizeKeycap,
  KEYCAP_SHORTCUTS,
} from './utils';

import { hideVariantsPanel, showVariantsPanel } from './variants';
import { Style } from '../public/core-types';
import { deepActiveElement } from '../ui/events/utils';
import { _Mathfield } from 'editor-mathfield/mathfield-private';

const SECONDARY_LAYOUT_CLASS = 'MLK__secondary-layout';
const SECONDARY_LAYOUT_MARKER = '__mathliveSecondaryLayout';
const MIN_CONDENSED_KEY_SCALE = 0.5;
const CONDENSED_VIEWPORT_BOTTOM_GUTTER = 8;
const ACTIVE_SCALE_PROPERTIES = [
  '--keycap-height',
  '--keycap-width',
  '--keycap-gap',
  '--keycap-font-size',
  '--keycap-small-font-size',
  '--keycap-extra-small-font-size',
  '--keycap-glyph-size',
  '--keycap-glyph-size-lg',
  '--keycap-glyph-size-xl',
  '--keycap-shift-font-size',
  '--_keycap-height',
  '--_keycap-width',
  '--_keycap-gap',
  '--_keycap-font-size',
  '--_keycap-small-font-size',
  '--_keycap-extra-small-font-size',
  '--_keycap-glyph-size',
  '--_keycap-glyph-size-lg',
  '--_keycap-glyph-size-xl',
  '--_keycap-shift-font-size',
];

type DomRowStructure = {
  rows: HTMLElement[];
  children: HTMLElement[][];
  rowHeight: number;
  direction: 'ltr' | 'rtl';
};

const domRowStructureCache = new WeakMap<HTMLElement, DomRowStructure>();

function readPixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resetActiveRowSizing(rows: HTMLElement): void {
  ACTIVE_SCALE_PROPERTIES.forEach((property) =>
    rows.style.removeProperty(property)
  );
  rows.style.transform = '';
  rows.style.transformOrigin = 'top center';
  rows.style.marginBottom = '0px';
}

function getDirectRows(rows: HTMLElement): HTMLElement[] {
  return Array.from(rows.querySelectorAll<HTMLElement>(':scope > .MLK__row'));
}

function restoreOriginalRows(rows: HTMLElement): DomRowStructure | null {
  const cached = domRowStructureCache.get(rows);
  if (!cached) return null;
  cached.rows.forEach((row, index) =>
    row.replaceChildren(...(cached.children[index] ?? []))
  );
  rows.replaceChildren(...cached.rows);
  rows.removeAttribute('data-mlk-packed');
  rows.removeAttribute('data-mlk-packed-width');
  rows.removeAttribute('data-mlk-packed-row-count');
  return cached;
}

function getOriginalRows(rows: HTMLElement): DomRowStructure {
  const currentRows = getDirectRows(rows);
  const cached = domRowStructureCache.get(rows);
  const currentRowsArePacked = currentRows.some((row) =>
    row.classList.contains('MLK__packed-row')
  );
  if (cached && rows.dataset.mlkPacked === '1' && !currentRowsArePacked)
    domRowStructureCache.delete(rows);

  const refreshed = domRowStructureCache.get(rows);
  if (
    refreshed &&
    currentRows.length === refreshed.rows.length &&
    currentRows.every((row, index) => row === refreshed.rows[index])
  )
    return refreshed;

  const structure: DomRowStructure = {
    rows: currentRows,
    children: currentRows.map(
      (row) => Array.from(row.children) as HTMLElement[]
    ),
    rowHeight: Math.max(...currentRows.map((row) => row.offsetHeight), 1),
    direction:
      currentRows[0] &&
      window.getComputedStyle(currentRows[0]).direction === 'rtl'
        ? 'rtl'
        : 'ltr',
  };
  domRowStructureCache.set(rows, structure);
  return structure;
}

type DomKeyboardSections = {
  left: HTMLElement[][];
  right: HTMLElement[][];
  dividerWidth: number;
};

function getKeyboardSections(
  structure: DomRowStructure,
  itemWidths?: Map<HTMLElement, number>
): DomKeyboardSections | null {
  const left: HTMLElement[][] = [];
  const right: HTMLElement[][] = [];
  let dividerWidth = 0;
  let hasDivider = false;

  structure.children.forEach((children) => {
    const dividerIndex = children.findIndex((child) =>
      child.classList.contains('separator')
    );
    if (dividerIndex < 0) {
      if (children.length > 0) left.push(children);
      return;
    }
    hasDivider = true;
    const divider = children[dividerIndex];
    dividerWidth = Math.max(
      dividerWidth,
      itemWidths?.get(divider) ??
        divider.getBoundingClientRect().width ??
        divider.offsetWidth
    );
    const leftRow = children.slice(0, dividerIndex);
    const rightRow = children.slice(dividerIndex + 1);
    if (leftRow.length > 0) left.push(leftRow);
    if (rightRow.length > 0) right.push(rightRow);
  });

  return hasDivider
    ? { left, right, dividerWidth: Math.max(1, dividerWidth) }
    : null;
}

function getItemsWidth(
  items: HTMLElement[],
  gap: number,
  widthScale: number,
  itemWidths?: Map<HTMLElement, number>
): number {
  return items.reduce(
    (total, item) =>
      total +
      (itemWidths?.get(item) ??
        item.getBoundingClientRect().width ??
        item.offsetWidth) *
        widthScale,
    Math.max(0, items.length - 1) * gap
  );
}

function wrapKeyboardItems(
  items: HTMLElement[],
  availableWidth: number,
  gap: number,
  widthScale: number,
  itemWidths?: Map<HTMLElement, number>
): HTMLElement[][] {
  const wrapped: HTMLElement[][] = [];
  let current: HTMLElement[] = [];
  let currentWidth = 0;
  items.forEach((item) => {
    const itemWidth = Math.max(
      1,
      (itemWidths?.get(item) ??
        item.getBoundingClientRect().width ??
        item.offsetWidth) * widthScale
    );
    const nextWidth = currentWidth + (current.length > 0 ? gap : 0) + itemWidth;
    if (current.length > 0 && nextWidth > availableWidth) {
      wrapped.push(current);
      current = [];
      currentWidth = 0;
    }
    current.push(item);
    currentWidth += (current.length > 1 ? gap : 0) + itemWidth;
  });
  if (current.length > 0) wrapped.push(current);
  return wrapped;
}

function splitKeyboardGroup(
  group: HTMLElement[],
  availableWidth: number,
  gap: number,
  widthScale: number,
  itemWidths?: Map<HTMLElement, number>
): HTMLElement[][] {
  const groupWidth = getItemsWidth(group, gap, widthScale, itemWidths);
  const rowCount = Math.max(
    2,
    Math.ceil(groupWidth / Math.max(1, availableWidth))
  );
  const rows: HTMLElement[][] = [];
  let cursor = 0;
  for (let index = 0; index < rowCount && cursor < group.length; index += 1) {
    const remainingItems = group.length - cursor;
    const remainingRows = rowCount - index;
    const itemCount = Math.max(1, Math.ceil(remainingItems / remainingRows));
    const candidate = group.slice(cursor, cursor + itemCount);
    if (
      getItemsWidth(candidate, gap, widthScale, itemWidths) > availableWidth
    ) {
      return wrapKeyboardItems(
        group,
        availableWidth,
        gap,
        widthScale,
        itemWidths
      );
    }
    rows.push(candidate);
    cursor += candidate.length;
  }
  return rows;
}

function wrapKeyboardGroups(
  groups: HTMLElement[][],
  availableWidth: number,
  gap: number,
  widthScale: number,
  itemWidths?: Map<HTMLElement, number>
): HTMLElement[][] {
  const wrapped: HTMLElement[][] = [];
  let current: HTMLElement[] = [];
  let currentWidth = 0;
  const flush = () => {
    if (current.length > 0) wrapped.push(current);
    current = [];
    currentWidth = 0;
  };

  groups.forEach((group) => {
    if (group.length === 0) return;
    const groupWidth = getItemsWidth(group, gap, widthScale, itemWidths);
    if (groupWidth > availableWidth) {
      flush();
      splitKeyboardGroup(
        group,
        availableWidth,
        gap,
        widthScale,
        itemWidths
      ).forEach((items) => wrapped.push(items));
      return;
    }
    const nextWidth =
      currentWidth + (current.length > 0 ? gap : 0) + groupWidth;
    if (current.length > 0 && nextWidth > availableWidth) flush();
    current.push(...group);
    currentWidth += (current.length > group.length ? gap : 0) + groupWidth;
  });
  flush();
  return wrapped;
}

function getPackedRowCount(
  structure: DomRowStructure,
  availableWidth: number,
  gap: number,
  widthScale: number,
  itemWidths?: Map<HTMLElement, number>,
  sections?: DomKeyboardSections | null
): number {
  const keyboardSections =
    sections ?? getKeyboardSections(structure, itemWidths);
  if (!keyboardSections) {
    return Math.max(
      1,
      wrapKeyboardGroups(
        structure.children,
        availableWidth,
        gap,
        widthScale,
        itemWidths
      ).length
    );
  }
  const sideWidth = Math.max(
    1,
    (availableWidth - keyboardSections.dividerWidth * widthScale) / 2
  );
  return Math.max(
    1,
    wrapKeyboardGroups(
      keyboardSections.left,
      sideWidth,
      gap,
      widthScale,
      itemWidths
    ).length,
    wrapKeyboardGroups(
      keyboardSections.right,
      sideWidth,
      gap,
      widthScale,
      itemWidths
    ).length
  );
}

function packRowsIntoAvailableWidth(
  rows: HTMLElement,
  structure: DomRowStructure,
  availableWidth: number,
  gap: number,
  widthScale: number,
  itemWidths?: Map<HTMLElement, number>,
  sections?: DomKeyboardSections | null
): void {
  const keyboardSections =
    sections ?? getKeyboardSections(structure, itemWidths);
  const packedRows: HTMLElement[] = [];
  const makeRow = (items: HTMLElement[]) => {
    const row = document.createElement('div');
    row.className = 'MLK__row MLK__packed-row';
    row.style.width = `${Math.max(1, availableWidth)}px`;
    row.style.maxWidth = '100%';
    row.style.marginInline = 'auto';
    row.style.direction = structure.direction;
    row.append(...items);
    packedRows.push(row);
  };

  if (!keyboardSections) {
    wrapKeyboardGroups(
      structure.children,
      availableWidth,
      gap,
      widthScale,
      itemWidths
    ).forEach(makeRow);
  } else {
    const sideWidth = Math.max(
      1,
      (availableWidth - keyboardSections.dividerWidth * widthScale) / 2
    );
    const leftRows = wrapKeyboardGroups(
      keyboardSections.left,
      sideWidth,
      gap,
      widthScale,
      itemWidths
    );
    const rightRows = wrapKeyboardGroups(
      keyboardSections.right,
      sideWidth,
      gap,
      widthScale,
      itemWidths
    );
    const makeSpacer = (width: number) => {
      const spacer = document.createElement('div');
      spacer.setAttribute('aria-hidden', 'true');
      spacer.style.width = `${Math.max(0, width)}px`;
      spacer.style.flex = `0 0 ${Math.max(0, width)}px`;
      return spacer;
    };
    const makeDivider = () => {
      const divider = document.createElement('div');
      divider.className = 'separator w5';
      divider.setAttribute('aria-hidden', 'true');
      divider.style.width = `${Math.max(1, keyboardSections.dividerWidth * widthScale)}px`;
      divider.style.flex = `0 0 ${Math.max(1, keyboardSections.dividerWidth * widthScale)}px`;
      return divider;
    };
    for (
      let index = 0;
      index < Math.max(leftRows.length, rightRows.length);
      index += 1
    ) {
      const left = leftRows[index] ?? [];
      const right = rightRows[index] ?? [];
      const row = document.createElement('div');
      row.className = 'MLK__row MLK__packed-row';
      row.style.width = `${Math.max(1, availableWidth)}px`;
      row.style.maxWidth = '100%';
      row.style.marginInline = 'auto';
      row.style.direction = structure.direction;
      row.append(
        ...left,
        makeSpacer(
          sideWidth - getItemsWidth(left, gap, widthScale, itemWidths)
        ),
        makeDivider(),
        makeSpacer(
          sideWidth - getItemsWidth(right, gap, widthScale, itemWidths)
        ),
        ...right
      );
      packedRows.push(row);
    }
  }

  if (packedRows.length >= structure.rows.length) return;
  rows.replaceChildren(...packedRows);
  rows.dataset.mlkPacked = '1';
  rows.dataset.mlkPackedWidth = String(Math.round(availableWidth));
  rows.dataset.mlkPackedRowCount = String(packedRows.length);
}

function isSeparatorKey(key: unknown): boolean {
  return (
    typeof key === 'object' &&
    key !== null &&
    String((key as { class?: string }).class ?? '').includes('separator')
  );
}

function keyWidth(key: unknown): number {
  if (isSeparatorKey(key)) return 0;
  const width =
    typeof key === 'object' && key !== null
      ? Number((key as { width?: number }).width)
      : 1;
  return Number.isFinite(width) && width > 0 ? width : 1;
}

function packedRows(
  rows: Partial<VirtualKeyboardKeycap>[][]
): Partial<VirtualKeyboardKeycap>[][] {
  const sections = rows.map((row) => {
    const divider = row.findIndex(isSeparatorKey);
    return divider < 0
      ? {
          left: row,
          right: [] as Partial<VirtualKeyboardKeycap>[],
          separator: undefined,
        }
      : {
          left: row.slice(0, divider),
          right: row.slice(divider + 1),
          separator: row[divider],
        };
  });
  const maxWidth = Math.max(
    1,
    ...sections.flatMap((section) => [
      section.left.reduce((sum, key) => sum + keyWidth(key), 0),
      section.right.reduce((sum, key) => sum + keyWidth(key), 0),
    ])
  );
  const target = Math.max(4, Math.ceil(maxWidth / 2));
  const pack = (groups: Partial<VirtualKeyboardKeycap>[][]) => {
    const result: Partial<VirtualKeyboardKeycap>[][] = [];
    let current: Partial<VirtualKeyboardKeycap>[] = [];
    let width = 0;
    const flush = () => {
      if (current.length) result.push(current);
      current = [];
      width = 0;
    };
    groups.forEach((group) => {
      const groupWidth = group.reduce((sum, key) => sum + keyWidth(key), 0);
      if (current.length && width + groupWidth > target) flush();
      current.push(...group.map((key) => ({ ...key })));
      width += groupWidth;
    });
    flush();
    return result;
  };
  const hasDivider = sections.some(
    (section) => section.separator !== undefined
  );
  if (!hasDivider) return pack(sections.map((section) => section.left));
  const left = pack(
    sections.map((section) => section.left).filter((row) => row.length)
  );
  const right = pack(
    sections.map((section) => section.right).filter((row) => row.length)
  );
  const separator = sections.find(
    (section) => section.separator !== undefined
  )?.separator;
  return Array.from(
    { length: Math.max(left.length, right.length) },
    (_, index) => [
      ...(left[index] ?? []),
      ...(separator ? [{ ...separator }] : []),
      ...(right[index] ?? []),
    ]
  );
}

function createSecondaryLayouts(layouts: NormalizedVirtualKeyboardLayout[]): {
  layouts: NormalizedVirtualKeyboardLayout[];
  layerMap: Map<string, string>;
} {
  const layerMap = new Map<string, string>();
  const secondary = layouts.map((layout, layoutIndex) => ({
    ...layout,
    labelClass: `${layout.labelClass ?? ''} ${SECONDARY_LAYOUT_CLASS}`.trim(),
    [SECONDARY_LAYOUT_MARKER]: true,
    displayEditToolbar: false,
    layers: layout.layers.map((layer, layerIndex) => {
      const id = `MLK__secondary-${layoutIndex}-${layerIndex}`;
      if (layer.id) layerMap.set(layer.id, id);
      return {
        ...layer,
        id,
        rows: layer.rows ? packedRows(layer.rows) : layer.rows,
      };
    }),
  })) as NormalizedVirtualKeyboardLayout[];
  return { layouts: secondary, layerMap };
}

function isSecondaryLayout(layout: NormalizedVirtualKeyboardLayout): boolean {
  return (
    layout.labelClass?.split(/\s+/).includes(SECONDARY_LAYOUT_CLASS) ?? false
  );
}

export class VirtualKeyboard implements VirtualKeyboardInterface, EventTarget {
  private _visible: boolean;
  private _element?: HTMLDivElement;
  private _rebuilding: boolean;
  private readonly observer: ResizeObserver;
  private originalContainerBottomPadding: string | null = null;
  private userHeight: number | null = null;
  private userResizing = false;
  private connectedMathfieldWindow: Window | undefined;
  private readonly listeners: {
    [type: string]: Set<EventListenerOrEventListenerObject | null>;
  };

  private keycapRegistry: Record<string, Partial<VirtualKeyboardKeycap>> = {};

  latentLayer: string;

  get currentLayer(): string {
    return this._element?.querySelector('.MLK__layer.is-visible')?.id ?? '';
  }

  set currentLayer(id: string) {
    if (!this._element) {
      this.latentLayer = id;
      return;
    }
    let newActive = id
      ? this._element.querySelector(`#${id}.MLK__layer`)
      : null;
    if (!newActive) newActive = this._element.querySelector('.MLK__layer');

    if (newActive) {
      this._element
        .querySelector('.MLK__layer.is-visible')
        ?.classList.remove('is-visible');
      newActive.classList.add('is-visible');
    }

    this.render();
    this.adjustBoundingRect();
  }

  /**
   * `0`: not pressed
   * `1`: Shift is locked for next char only
   * `2`: Shift is locked for all characters
   */
  private _shiftPressCount: 0 | 1 | 2 = 0;

  get shiftPressCount(): typeof this._shiftPressCount {
    return this._shiftPressCount;
  }

  set shiftPressCount(count: typeof this._shiftPressCount) {
    this._shiftPressCount = count > 2 || count < 0 ? 0 : count;
    this._element?.classList.toggle('is-caps-lock', this.shiftPressCount === 2);

    this.render();
  }

  get isShifted(): boolean {
    return this._shiftPressCount > 0;
  }

  resetKeycapRegistry(): void {
    this.keycapRegistry = {};
  }

  registerKeycap(keycap: Partial<VirtualKeyboardKeycap>): string {
    const id =
      'ML__k' +
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);

    this.keycapRegistry[id] = keycap;
    return id;
  }

  setKeycap(
    keycap: string,
    value: string | Partial<VirtualKeyboardKeycap>
  ): void {
    KEYCAP_SHORTCUTS[keycap] = normalizeKeycap(value);
    this.rebuild();
  }

  getKeycap(
    id: string | undefined
  ): Partial<VirtualKeyboardKeycap> | undefined {
    return id ? (KEYCAP_SHORTCUTS[id] ?? this.keycapRegistry[id]) : undefined;
  }

  getLayer(id: string): NormalizedVirtualKeyboardLayer | undefined {
    const layouts = this.normalizedLayouts;
    for (const layout of layouts)
      for (const layer of layout.layers) if (layer.id === id) return layer;

    return undefined;
  }

  private _alphabeticLayout: AlphabeticKeyboardLayout;
  get alphabeticLayout(): AlphabeticKeyboardLayout {
    return this._alphabeticLayout;
  }
  set alphabeticLayout(value: AlphabeticKeyboardLayout) {
    this._alphabeticLayout = value;
    this._normalizedLayouts = undefined;
    this.rebuild();
  }

  private _layouts: readonly (VirtualKeyboardName | VirtualKeyboardLayout)[];

  get layouts(): readonly (VirtualKeyboardName | VirtualKeyboardLayout)[] {
    return this._layouts;
  }
  set layouts(
    value:
      | 'default'
      | (VirtualKeyboardName | VirtualKeyboardLayout)[]
      | readonly (VirtualKeyboardName | VirtualKeyboardLayout)[]
  ) {
    this.updateNormalizedLayouts(value);
    this.rebuild();
  }

  private updateNormalizedLayouts(
    value:
      | 'default'
      | (VirtualKeyboardName | VirtualKeyboardLayout)[]
      | readonly (VirtualKeyboardName | VirtualKeyboardLayout)[]
  ): void {
    const layouts = Array.isArray(value) ? [...value] : [value];
    const defaultIndex = layouts.findIndex((x) => x === 'default');
    if (defaultIndex >= 0) {
      layouts.splice(
        defaultIndex,
        1,
        'numeric',
        'symbols',
        'alphabetic',
        'greek'
      );
    }

    this._layouts = Object.freeze<
      (VirtualKeyboardName | VirtualKeyboardLayout)[]
    >(layouts as (VirtualKeyboardName | VirtualKeyboardLayout)[]);

    const normalized = layouts.map((x) => normalizeLayout(x));
    const generated = createSecondaryLayouts(normalized);
    this._secondaryLayerMap = generated.layerMap;
    this._normalizedLayouts = [...normalized, ...generated.layouts];
  }

  private _normalizedLayouts:
    | (VirtualKeyboardLayoutCore & {
        layers: NormalizedVirtualKeyboardLayer[];
      })[]
    | undefined;
  private _secondaryLayerMap = new Map<string, string>();
  get normalizedLayouts(): (VirtualKeyboardLayoutCore & {
    layers: NormalizedVirtualKeyboardLayer[];
  })[] {
    if (!this._normalizedLayouts) this.updateNormalizedLayouts(this._layouts);
    return this._normalizedLayouts!;
  }

  private _editToolbar: EditToolbarOptions;
  get editToolbar(): EditToolbarOptions {
    return this._editToolbar;
  }
  set editToolbar(value: EditToolbarOptions) {
    this._editToolbar = value;
    this.rebuild();
  }

  private _container: HTMLElement | undefined | null;
  get container(): HTMLElement | null {
    if (this._container === undefined) return window.document.body;
    return this._container;
  }
  set container(value: HTMLElement | null) {
    this._container = value;
    this.rebuild();
  }

  targetOrigin: string;
  originValidator: OriginValidator;
  isSandbox: boolean = false;

  private static _singleton: VirtualKeyboard | null;
  static get singleton(): VirtualKeyboard | null {
    if (this._singleton === undefined) {
      try {
        this._singleton = new VirtualKeyboard();
      } catch (e) {
        this._singleton = null;
      }
    }
    return this._singleton;
  }

  private _style: Style;
  get style(): Style {
    return this._style;
  }

  constructor() {
    this.targetOrigin = window.origin;
    this.originValidator = 'none';

    this._alphabeticLayout = 'auto';
    this._layouts = Object.freeze(['default']);
    this._editToolbar = 'default';

    this._container = undefined;

    this._visible = false;
    this._rebuilding = false;
    this.observer = new ResizeObserver((_entries) => {
      this.adjustBoundingRect();
      this.dispatchEvent(new Event('geometrychange'));
      this.sendMessage('geometry-changed', { boundingRect: this.boundingRect });
    });

    this.listeners = {};

    try {
      window.top?.addEventListener('message', this);
    } catch (e) {
      // We are in an iframe and the parent document is not accessible
      // (different domains)
      window.addEventListener('message', this);
    }

    // Listen for when a mathfield gets focused, and show
    // the virtual keyboard if needed
    if (isTouchCapable()) {
      document.addEventListener('focusin', (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (!target?.isConnected) return;
        setTimeout(() => {
          const mf = focusedMathfield();
          if (!mf) return;
          if (mf.mathVirtualKeyboardPolicy === 'auto' && mf.hasEditableContent)
            this.show({ animate: true });
        }, 300);
      });
    }

    document.addEventListener('focusout', (evt) => {
      if (!(evt.target instanceof MathfieldElement)) return;
      if (evt.target.mathVirtualKeyboardPolicy !== 'manual') {
        // If after a short delay the active element is no longer
        // a mathfield (or there is no active element),
        // hide the virtual keyboard

        setTimeout(() => {
          if (!focusedMathfield()) this.hide();
        }, 300);
      }
    });
  }

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    _options?: AddEventListenerOptions | boolean
  ): void {
    if (!this.listeners[type]) this.listeners[type] = new Set();
    if (!this.listeners[type].has(callback)) this.listeners[type].add(callback);
  }

  dispatchEvent(event: Event): boolean {
    if (!this.listeners[event.type] || this.listeners[event.type].size === 0)
      return true;
    this.listeners[event.type].forEach((x) => {
      if (typeof x === 'function') x(event);
      else x?.handleEvent(event);
    });
    return !event.defaultPrevented;
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    _options?: EventListenerOptions | boolean
  ): void {
    if (this.listeners[type]) this.listeners[type].delete(callback);
  }

  get element(): HTMLDivElement | undefined {
    return this._element;
  }
  set element(val: HTMLDivElement | undefined) {
    if (this._element === val) return;
    this._element?.remove();
    this._element = val;
  }
  get visible(): boolean {
    return this._visible;
  }
  set visible(val: boolean) {
    if (val) this.show();
    else this.hide();
  }

  get boundingRect(): DOMRect {
    if (!this._visible) return new DOMRect();
    const plate = this._element?.getElementsByClassName('MLK__plate')[0];
    if (plate) return plate.getBoundingClientRect();
    return new DOMRect();
  }

  get plateHeight(): number {
    return (
      this._element
        ?.querySelector<HTMLElement>('.MLK__plate')
        ?.getBoundingClientRect().height ?? 0
    );
  }

  setUserHeight(height: number): void {
    const plate = this._element?.querySelector<HTMLElement>('.MLK__plate');
    if (!plate) return;

    const minimum = 96;
    const maximum = Math.max(minimum, window.innerHeight - 16);
    this.userHeight = Math.min(Math.max(height, minimum), maximum);
    plate.style.height = `${this.userHeight}px`;
    this.fitCurrentLayer();
    this.adjustBoundingRect();
  }

  beginUserResize(): void {
    this.userResizing = true;
  }

  endUserResize(): void {
    this.userResizing = false;
    this.fitCurrentLayer();
    this.adjustBoundingRect();
  }

  adjustBoundingRect(): void {
    if (!this._element) return;
    if (!this.userResizing) this.fitCurrentLayer();
    // Adjust the keyboard height
    const h = this.boundingRect.height;
    if (this.container === document.body) {
      this._element.style.setProperty(
        '--_keyboard-height',
        `calc(${h}px + var(--_padding-top) + var(--_padding-bottom))`
      );
      const keyboardHeight = h - 1;
      this.container!.style.paddingBottom = this.originalContainerBottomPadding
        ? `calc(${this.originalContainerBottomPadding} + ${keyboardHeight}px)`
        : `${keyboardHeight}px`;
    } else this._element.style.setProperty('--_keyboard-height', `${h}px`);
  }

  /**
   * Resize the active keyboard as one unit before changing its row structure.
   * If the source rows cannot fit above the readable floor, switch to the
   * generated companion layout. Dynamic packing remains a last resort for
   * layouts that do not have a companion, preserving source-row order and
   * left/right separator alignment.
   */
  private fitCurrentLayer(): void {
    if (!this._element) return;
    const plate = this._element.querySelector<HTMLElement>('.MLK__plate');
    const layer = this._element.querySelector<HTMLElement>(
      '.MLK__layer.is-visible'
    );
    const rows = layer?.querySelector<HTMLElement>('.MLK__rows');
    if (!plate || !layer || !rows || rows.clientHeight <= 0) return;

    const availableHeight = Math.max(
      1,
      plate.clientHeight -
        (layer.querySelector<HTMLElement>('.MLK__toolbar')?.offsetHeight ?? 0) -
        CONDENSED_VIEWPORT_BOTTOM_GUTTER
    );
    const availableWidth = Math.max(1, rows.clientWidth);
    const current = this.currentLayer;
    const activeLayout = this.normalizedLayouts.find((layout) =>
      layout.layers.some((item) => item.id === current)
    );

    const signatureParts = [
      Math.round(availableWidth),
      Math.round(availableHeight),
      rows.dataset.mlkPackedWidth ?? '0',
      rows.dataset.mlkPackedRowCount ?? '0',
      getDirectRows(rows).length,
    ];
    if (rows.dataset.mlkLayoutSignature === signatureParts.join(':')) return;

    const secondary = activeLayout ? isSecondaryLayout(activeLayout) : false;
    if (secondary) {
      const baseHeight = Number(plate.dataset.mlkSecondaryBaseHeight ?? '0');
      const base = [...this._secondaryLayerMap.entries()].find(
        ([, id]) => id === current
      )?.[0];
      if (base && baseHeight > 0 && availableHeight >= baseHeight + 4) {
        resetActiveRowSizing(rows);
        plate.removeAttribute('data-mlk-secondary-base-height');
        this.currentLayer = base;
        return;
      }

      resetActiveRowSizing(rows);
      const computedRows = window.getComputedStyle(rows);
      const rowElements = getDirectRows(rows);
      const gap = Math.max(
        1,
        readPixels(computedRows.rowGap || computedRows.gap)
      );
      const naturalHeight =
        rowElements.reduce((total, row) => total + row.offsetHeight, 0) +
        gap * Math.max(0, rowElements.length - 1);
      const firstKey = rows.querySelector<HTMLElement>(
        '.MLK__keycap, .action, .shift'
      );
      const firstGlyph = rows.querySelector<SVGElement>('svg');
      const keyGap = Math.max(
        1,
        readPixels(computedRows.getPropertyValue('--_keycap-gap')) || gap
      );
      const keyWidth = Math.max(
        1,
        readPixels(computedRows.getPropertyValue('--_keycap-width')) ||
          (firstKey?.getBoundingClientRect().width ?? 0) + keyGap
      );
      const keyHeight = Math.max(
        firstKey?.getBoundingClientRect().height ??
          rowElements[0]?.offsetHeight ??
          1,
        1
      );
      const fontSize = Math.max(
        readPixels(
          firstKey ? window.getComputedStyle(firstKey).fontSize : '16px'
        ),
        1
      );
      const glyphSize = Math.max(
        readPixels(
          firstGlyph ? window.getComputedStyle(firstGlyph).width : '20px'
        ),
        1
      );
      const applyScale = (nextScale: number) => {
        const widthScale = Math.max(MIN_CONDENSED_KEY_SCALE, nextScale);
        const values: Record<string, number> = {
          '--keycap-width': Math.max(14, keyWidth * widthScale),
          '--keycap-height': Math.max(8, keyHeight * nextScale),
          '--keycap-gap': Math.max(2, keyGap * widthScale),
          '--keycap-font-size': Math.max(5, fontSize * nextScale),
          '--keycap-small-font-size': Math.max(4, fontSize * nextScale * 0.8),
          '--keycap-extra-small-font-size': Math.max(
            4,
            (fontSize * nextScale) / 1.42
          ),
          '--keycap-glyph-size': Math.max(6, glyphSize * nextScale),
          '--keycap-glyph-size-lg': Math.max(8, glyphSize * nextScale * 1.2),
          '--keycap-glyph-size-xl': Math.max(10, glyphSize * nextScale * 2.5),
        };
        Object.entries(values).forEach(([property, value]) => {
          rows.style.setProperty(property, `${value}px`);
          rows.style.setProperty(
            property.replace('--keycap-', '--_keycap-'),
            `${value}px`
          );
        });
      };
      let scale = Math.min(1, availableHeight / Math.max(1, naturalHeight));
      for (let attempt = 0; attempt < 5; attempt += 1) {
        applyScale(scale);
        const actualHeight = rows.getBoundingClientRect().height;
        if (actualHeight <= availableHeight + 1) break;
        scale *= availableHeight / Math.max(1, actualHeight);
      }
      applyScale(scale);
      rows.dataset.mlkLayoutSignature = [
        Math.round(availableWidth),
        Math.round(availableHeight),
        'secondary',
        getDirectRows(rows).length,
      ].join(':');
      return;
    }

    const currentRows = getDirectRows(rows);
    const currentRowsArePacked = currentRows.some((row) =>
      row.classList.contains('MLK__packed-row')
    );
    const isPacked = rows.dataset.mlkPacked === '1' && currentRowsArePacked;
    if (isPacked) restoreOriginalRows(rows);
    else if (currentRowsArePacked) restoreOriginalRows(rows);

    const structure = getOriginalRows(rows);
    if (structure.rows.length === 0) return;
    resetActiveRowSizing(rows);

    const computedRows = window.getComputedStyle(rows);
    const gap = readPixels(computedRows.rowGap || computedRows.gap);
    const rowHeight = Math.max(structure.rowHeight, 1);
    const originalHeight =
      rowHeight * structure.rows.length +
      gap * Math.max(0, structure.rows.length - 1);
    const firstKey = rows.querySelector<HTMLElement>(
      '.MLK__keycap, .action, .shift'
    );
    const firstGlyph = rows.querySelector<SVGElement>('svg');
    const keyHeight = Math.max(
      firstKey?.getBoundingClientRect().height ?? rowHeight,
      1
    );
    const fontSize = Math.max(
      readPixels(
        firstKey ? window.getComputedStyle(firstKey).fontSize : '16px'
      ),
      1
    );
    const glyphSize = Math.max(
      readPixels(
        firstGlyph ? window.getComputedStyle(firstGlyph).width : '20px'
      ),
      1
    );
    const keyGap = Math.max(
      1,
      readPixels(computedRows.getPropertyValue('--_keycap-gap')) || gap
    );
    const keyWidth = Math.max(
      1,
      readPixels(computedRows.getPropertyValue('--_keycap-width')) ||
        (firstKey?.getBoundingClientRect().width ?? 0) + keyGap
    );
    const itemWidths = new Map<HTMLElement, number>();
    structure.children.flat().forEach((item) => {
      itemWidths.set(
        item,
        Math.max(1, item.getBoundingClientRect().width || item.offsetWidth)
      );
    });
    const sections = getKeyboardSections(structure, itemWidths);
    const applyScale = (nextScale: number) => {
      const widthScale = Math.max(MIN_CONDENSED_KEY_SCALE, nextScale);
      const values: Record<string, number> = {
        '--keycap-width': Math.max(14, keyWidth * widthScale),
        '--keycap-height': Math.max(8, keyHeight * nextScale),
        '--keycap-gap': Math.max(2, keyGap * widthScale),
        '--keycap-font-size': Math.max(5, fontSize * nextScale),
        '--keycap-small-font-size': Math.max(4, fontSize * nextScale * 0.8),
        '--keycap-extra-small-font-size': Math.max(
          4,
          (fontSize * nextScale) / 1.42
        ),
        '--keycap-glyph-size': Math.max(6, glyphSize * nextScale),
        '--keycap-glyph-size-lg': Math.max(8, glyphSize * nextScale * 1.2),
        '--keycap-glyph-size-xl': Math.max(10, glyphSize * nextScale * 2.5),
      };
      Object.entries(values).forEach(([property, value]) => {
        rows.style.setProperty(property, `${value}px`);
        rows.style.setProperty(
          property.replace('--keycap-', '--_keycap-'),
          `${value}px`
        );
      });
    };
    const fitRenderedRows = (initialScale: number): number => {
      let nextScale = Math.min(1, initialScale);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        applyScale(nextScale);
        const actualHeight = rows.getBoundingClientRect().height;
        if (actualHeight <= availableHeight + 1) return nextScale;
        nextScale *= availableHeight / Math.max(1, actualHeight);
      }
      applyScale(nextScale);
      return nextScale;
    };

    const originalScale = fitRenderedRows(
      Math.min(1, availableHeight / Math.max(1, originalHeight))
    );
    if (
      originalScale >= MIN_CONDENSED_KEY_SCALE &&
      rows.getBoundingClientRect().height <= availableHeight + 1
    ) {
      plate.removeAttribute('data-mlk-secondary-base-height');
      rows.dataset.mlkLayoutSignature = [
        Math.round(availableWidth),
        Math.round(availableHeight),
        rows.dataset.mlkPackedWidth ?? '0',
        rows.dataset.mlkPackedRowCount ?? '0',
        getDirectRows(rows).length,
      ].join(':');
      return;
    }

    const secondaryLayerId = this._secondaryLayerMap.get(current);
    if (secondaryLayerId) {
      plate.dataset.mlkSecondaryBaseHeight = String(
        Math.ceil(originalHeight * MIN_CONDENSED_KEY_SCALE)
      );
      resetActiveRowSizing(rows);
      this.currentLayer = secondaryLayerId;
      return;
    }

    // A custom layout may not have a generated companion. Pack complete
    // source rows only as a last resort, keeping separator-defined sections
    // aligned while retaining the original key order.
    resetActiveRowSizing(rows);
    const projectedHeight = (nextScale: number) => {
      const layoutScale = Math.max(MIN_CONDENSED_KEY_SCALE, nextScale);
      const scaledGap = gap * layoutScale;
      const rowCount = getPackedRowCount(
        structure,
        availableWidth,
        scaledGap,
        layoutScale,
        itemWidths,
        sections
      );
      return (
        rowCount * rowHeight * nextScale + scaledGap * Math.max(0, rowCount - 1)
      );
    };
    let scale = 1;
    if (projectedHeight(scale) > availableHeight) {
      let low = MIN_CONDENSED_KEY_SCALE;
      let high = 1;
      scale = MIN_CONDENSED_KEY_SCALE;
      if (projectedHeight(MIN_CONDENSED_KEY_SCALE) <= availableHeight) {
        for (let attempt = 0; attempt < 24; attempt += 1) {
          const candidate = (low + high) / 2;
          if (projectedHeight(candidate) <= availableHeight) {
            scale = candidate;
            low = candidate;
          } else high = candidate;
        }
      }
    }
    const layoutScale = Math.max(MIN_CONDENSED_KEY_SCALE, scale);
    const packedRowCount = getPackedRowCount(
      structure,
      availableWidth,
      gap * layoutScale,
      layoutScale,
      itemWidths,
      sections
    );
    if (packedRowCount < structure.rows.length) {
      packRowsIntoAvailableWidth(
        rows,
        structure,
        availableWidth,
        gap * layoutScale,
        layoutScale,
        itemWidths,
        sections
      );
    }
    scale = fitRenderedRows(scale);
    rows.dataset.mlkLayoutSignature = [
      Math.round(availableWidth),
      Math.round(availableHeight),
      rows.dataset.mlkPackedWidth ?? '0',
      rows.dataset.mlkPackedRowCount ?? '0',
      getDirectRows(rows).length,
    ].join(':');
  }

  // adjustBoundingRect(): void {
  //   if (!this._element) return;

  //   // Adjust the keyboard height
  //   const h = this.boundingRect.height;

  //   if (this.container !== document.body) {
  //     // We don't adjust the padding bottom if the container is not the body
  //     this._element.style.setProperty('--_keyboard-height', `${h}px`);
  //     return;
  //   }

  //   this._element.style.setProperty(
  //     '--_keyboard-height',
  //     `calc(${h}px + var(--_padding-top) + var(--_padding-bottom) + env(safe-area-inset-bottom, 0))`
  //   );
  //   const keyboardHeight = `${h - 1}px + var(--_padding-top) + var(--_padding-bottom) + env(safe-area-inset-bottom, 0)`;
  //   document.body.style.paddingBottom = this.originalContainerBottomPadding
  //     ? `calc(${this.originalContainerBottomPadding} + ${keyboardHeight})`
  //     : `calc(${keyboardHeight})`;
  // }

  rebuild(): void {
    if (this._rebuilding || !this._element) return;

    this._rebuilding = true;

    const currentLayerId = this.currentLayer;
    requestAnimationFrame(() => {
      this._rebuilding = false;

      // By the time the handler is called, the _element may have been destroyed
      if (this._element) {
        this._element.remove();
        this._element = undefined;
      }
      if (this.visible) {
        this.buildAndAttachElement();

        // Restore the active keyboard
        this.currentLayer = currentLayerId;

        this.render();

        this.adjustBoundingRect();

        // Show the keyboard panel
        this._element!.classList.add('is-visible');
      }
    });
  }

  /** Update the keycaps to account for the current state */
  render(): void {
    if (!this._element) return;

    // If there's a container, hide the default backdrop
    const layer = this.getLayer(this.currentLayer);
    this._element.classList.toggle(
      'backdrop-is-transparent',
      Boolean(layer && (layer.backdrop || layer.container))
    );

    const keycaps = this._element.querySelectorAll<HTMLElement>(
      '.MLK__layer.is-visible .MLK__keycap, .MLK__layer.is-visible .action, .fnbutton, .MLK__layer.is-visible .bigfnbutton, .MLK__layer.is-visible .shift'
    );

    if (!keycaps) return;

    const shifted = this.isShifted;
    for (const keycapElement of keycaps) {
      const keycap = this.getKeycap(keycapElement.id);
      if (keycap) {
        const [markup, cls] = renderKeycap(keycap, { shifted });
        keycapElement.innerHTML =
          globalThis.MathfieldElement.createHTML(markup);
        keycapElement.className = cls;
        if (
          shifted &&
          typeof keycap.shift === 'object' &&
          keycap.shift?.tooltip
        )
          keycapElement.dataset.tooltip = keycap.shift.tooltip;
        else if (!shifted && keycap.tooltip)
          keycapElement.dataset.tooltip = keycap.tooltip;
      }
    }
  }

  show(options?: { animate: boolean }): void {
    if (this._visible) return;

    const container = this.container;
    if (!container) return;

    if (!window.mathVirtualKeyboard) return;

    // Confirm
    if (!this.stateWillChange(true)) return;

    if (!this._element) {
      this.buildAndAttachElement();
      this.adjustBoundingRect();
    }

    if (!this._visible) {
      const plate = this._element!.getElementsByClassName(
        'MLK__plate'
      )[0] as HTMLElement;
      if (plate) this.observer.observe(plate);

      if (container === window.document.body) {
        const padding = container.style.paddingBottom;
        this.originalContainerBottomPadding = padding;
        const keyboardHeight = plate.offsetHeight - 1;
        container.style.paddingBottom = padding
          ? `calc(${padding} + ${keyboardHeight}px)`
          : `${keyboardHeight}px`;
      }
      window.addEventListener('mouseup', this);
      window.addEventListener('blur', this);
      window.addEventListener('keydown', this, { capture: true });
      window.addEventListener('keyup', this, { capture: true });

      this._element?.classList.toggle(
        'is-caps-lock',
        this.shiftPressCount === 2
      );

      this.currentLayer = this.latentLayer;
    }

    this._visible = true;

    // For the transition effect to work, the property has to be changed
    // after the insertion in the DOM.
    if (options?.animate) {
      requestAnimationFrame(() => {
        if (this._element) {
          this._element.classList.add('animate');
          this._element.addEventListener(
            'transitionend',
            () => this._element?.classList.remove('animate'),
            { once: true }
          );
          this._element.classList.add('is-visible');
          this.stateChanged();
        }
      });
    } else {
      this._element!.classList.add('is-visible');
      this.stateChanged();
    }
  }

  hide(_options?: { animate: boolean }): void {
    const container = this.container;
    if (!container) return;
    if (!this._visible) return;

    // Confirm
    if (!this.stateWillChange(false)) return;
    this._visible = false;

    if (this._element) {
      this.latentLayer = this.currentLayer;

      const plate = this._element.getElementsByClassName('MLK__plate')[0];
      if (plate) this.observer.unobserve(plate);

      // Remove the element from the DOM
      window.removeEventListener('mouseup', this);
      window.removeEventListener('blur', this);
      window.removeEventListener('keydown', this, { capture: true });
      window.removeEventListener('keyup', this, { capture: true });
      window.removeEventListener('contextmenu', this, { capture: true });
      hideVariantsPanel();

      releaseStylesheets();

      this._element?.remove();
      this._element = undefined;

      if (this.originalContainerBottomPadding !== null)
        container.style.paddingBottom = this.originalContainerBottomPadding;
    }

    this.stateChanged();
  }

  get height(): number {
    return this.element?.offsetHeight ?? 0;
  }

  buildAndAttachElement(): void {
    console.assert(!this.element);
    this.element = makeKeyboardElement(this);
    // this.element.addEventListener('pointerdown', () => this.focus());

    // To prevent the long press contextmenu from showing up in Chrome...
    window.addEventListener('contextmenu', this, { capture: true });

    this.element.addEventListener(
      'contextmenu',
      (ev) => {
        if (!ev.shiftKey) {
          if (ev.ctrlKey || ev.button === 2)
            showVariantsPanel(ev.target as HTMLElement);
          ev.preventDefault();
          ev.stopPropagation();
        }
      },
      { capture: true }
    );
    this.container?.appendChild(this.element);
    if (this.userHeight !== null) {
      const plate = this.element.querySelector<HTMLElement>('.MLK__plate');
      if (plate) plate.style.height = `${this.userHeight}px`;
    }
  }

  handleEvent(
    evt:
      | (MessageEvent<VirtualKeyboardMessage> & { type: 'message' })
      | (PointerEvent & { type: 'contextmenu' | 'mouseup' })
      | (KeyboardEvent & { type: 'keydown' | 'keyup' })
      | (FocusEvent & { type: 'blur' })
  ): void {
    if (isVirtualKeyboardMessage(evt)) {
      if (!validateOrigin(evt.origin, this.originValidator)) {
        throw new DOMException(
          `Message from unknown origin (${evt.origin}) cannot be handled`,
          'SecurityError'
        );
      }
      if (evt.data.action === 'disconnect') {
        // Ignore ALL disconnect requests while VK is visible
        if (this._visible) return;

        this.connectedMathfieldWindow = undefined;
      } else if (
        evt.data.action !== 'update-setting' &&
        evt.data.action !== 'proxy-created' &&
        evt.data.action !== 'execute-command'
      ) {
        console.assert(evt.source !== undefined);
        this.connectedMathfieldWindow = evt.source as Window;
      }

      this.handleMessage(evt.data, evt.source);
    }

    if (!this._element) return;

    switch (evt.type) {
      case 'mouseup':
      case 'blur':
        // Safari on iOS will aggressively attempt to select when there is a long
        // press. Restore the userSelect on mouse up
        document.body.style.userSelect = '';

        this.shiftPressCount = 0;
        break;

      case 'contextmenu':
        if (evt.button !== 2) evt.preventDefault();
        break;

      case 'keydown': {
        if (evt.key === 'Shift' && !evt.repeat) this.shiftPressCount = 1;
        break;
      }

      case 'keyup': {
        if (
          evt.key === 'Shift' ||
          (!evt.getModifierState('Shift') && this.shiftPressCount !== 2)
        )
          this.shiftPressCount = 0;
        break;
      }
    }
  }

  handleMessage(
    msg: VirtualKeyboardMessage,
    source: MessageEventSource | null
  ): void {
    const { action } = msg;
    if (action === 'execute-command') {
      const { command } = msg;
      const commandTarget = getCommandTarget(command!);

      // If we're in the top window and receiving a message from an iframe,
      // don't handle it here (the iframe's mathfield will handle it)
      if (window === window.top && source !== window) return;

      // If we're receiving our own message for a mathfield command,
      // don't re-execute it here (the local mathfield will handle it)
      if (source === window && commandTarget !== 'virtual-keyboard') return;

      this.executeCommand(command!);
      return;
    }

    if (action === 'connect' || action === 'show') {
      this.sendMessage(
        'synchronize-proxy',
        {
          boundingRect: this.boundingRect,
          alphabeticLayout: this._alphabeticLayout,
          layouts: this._layouts,
          editToolbar: this._editToolbar,
        },
        source
      );
    }

    if (action === 'disconnect') return;

    // If the mathVirtualKeyboardPolicy was set to `sandboxed`,
    // we can be a VirtualKeyboard instance (not a proxy) inside a non-top-level
    // browsing context. If that's the case, safely ignored messages that could
    // be dispatched from other mathfields, as we will only respond to
    // direct invocation via function dispatching on the VK instance.
    if (this.isSandbox) return;

    if (action === 'show') {
      if (typeof msg.animate !== 'undefined')
        this.show({ animate: msg.animate });
      else this.show();
      return;
    }

    if (action === 'hide') {
      if (typeof msg.animate !== 'undefined')
        this.hide({ animate: msg.animate });
      else this.hide();
      return;
    }

    if (action === 'update-setting') {
      // A proxy has an updated setting
      if (msg.alphabeticLayout) this.alphabeticLayout = msg.alphabeticLayout;
      if (msg.layouts) this.layouts = msg.layouts;
      if (msg.editToolbar) this.editToolbar = msg.editToolbar;
      if (msg.setKeycap) {
        const { keycap, value } = msg.setKeycap;
        this.setKeycap(keycap, value);
        this.render();
      }
      return;
    }

    if (action === 'proxy-created') {
      // A new proxy has been created. Dispatch a message to synchronize
      // the reflected state
      this.sendMessage(
        'synchronize-proxy',
        {
          boundingRect: this.boundingRect,
          alphabeticLayout: this._alphabeticLayout,
          layouts: this._layouts,
          editToolbar: this._editToolbar,
        },
        source
      );
      return;
    }
  }

  private sendMessage(
    action: VirtualKeyboardMessageAction,
    payload: any,
    target?: MessageEventSource | null
  ): void {
    // Dispatch an event. The listeners must listen to `mathVirtualKeyboard`
    if (payload.command) {
      this.dispatchEvent(
        new CustomEvent('math-virtual-keyboard-command', {
          detail: payload.command,
        })
      );
    }

    if (!target) target = this.connectedMathfieldWindow;
    if (
      this.targetOrigin === null ||
      this.targetOrigin === 'null' ||
      target === window
    ) {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: window,
          origin: window.origin,
          data: {
            type: VIRTUAL_KEYBOARD_MESSAGE,
            action,
            ...payload,
          },
        })
      );
      return;
    }

    if (target) {
      target.postMessage(
        {
          type: VIRTUAL_KEYBOARD_MESSAGE,
          action,
          ...payload,
        },
        { targetOrigin: this.targetOrigin }
      );
    } else {
      if (
        action === 'execute-command' &&
        Array.isArray(payload.command) &&
        payload.command[0] === 'insert'
      ) {
        const s = payload.command[1].split('');
        for (const c of s) {
          this.dispatchEvent(
            new KeyboardEvent('keydown', { key: c, bubbles: true })
          );
          this.dispatchEvent(
            new KeyboardEvent('keyup', { key: c, bubbles: true })
          );
        }
      }
    }
  }

  stateWillChange(visible: boolean): boolean {
    const success = this.dispatchEvent(
      new CustomEvent('before-virtual-keyboard-toggle', {
        detail: { visible },
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    );
    return success;
  }

  stateChanged(): void {
    this.dispatchEvent(new Event('virtual-keyboard-toggle'));
    if (!this._visible) {
      this.dispatchEvent(new Event('geometrychange'));
      this.sendMessage('geometry-changed', {
        boundingRect: this.boundingRect,
      });
    }
  }

  /**
   * @category Focus
   */
  public focus(): void {
    this.sendMessage('focus', {});
  }

  /**
   * @category Focus
   */
  public blur(): void {
    this.sendMessage('blur', {});
  }

  updateToolbar(mf: MathfieldProxy): void {
    const el = this._element;
    if (!el) return;

    el.classList.toggle('is-math-mode', mf.mode === 'math');
    el.classList.toggle('is-text-mode', mf.mode === 'text');

    el.classList.toggle('can-undo', mf.canUndo);
    el.classList.toggle('can-redo', mf.canRedo);
    el.classList.toggle('can-copy', !mf.selectionIsCollapsed);
    el.classList.toggle('can-cut', !mf.selectionIsCollapsed); // @fixme: Should check if readonly
    el.classList.toggle('can-paste', true);

    const toolbars = el.querySelectorAll('.ML__edit-toolbar');
    if (!toolbars) return;
    for (const toolbar of toolbars)
      toolbar.innerHTML = makeEditToolbar(this, mf);
  }

  update(mf: MathfieldProxy): void {
    this._style = mf.style;
    this.updateToolbar(mf);
  }

  connect(): void {
    this.connectedMathfieldWindow = window;
  }

  disconnect(): void {
    // Ignore ALL disconnect requests while VK is visible
    if (this._visible) return;

    this.connectedMathfieldWindow = undefined;
  }

  executeCommand(
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
  ): boolean {
    command = parseCommand(command) as
      | SelectorPrivate
      | [SelectorPrivate, ...any[]];
    if (!command) return false;

    let selector: SelectorPrivate;
    let args: string[] = [];
    let target = getCommandTarget(command);

    if (isArray(command)) {
      selector = command[0];
      if (selector === 'performWithFeedback') {
        target = getCommandTarget(
          command.slice(1) as [SelectorPrivate, ...any[]]
        );
      }
      args = command.slice(1);
    } else selector = command;

    if (target === 'virtual-keyboard')
      return COMMANDS[selector]!.fn(undefined, ...args);

    this.sendMessage('execute-command', { command });
    return false;
  }

  dispose(): void {
    window.removeEventListener('mouseup', this);
    window.removeEventListener('blur', this);
    window.removeEventListener('message', this);
  }
}

function focusedMathfield(): MathfieldElement | null {
  let target: Node | null = deepActiveElement() as unknown as Node | null;
  let mf: MathfieldElement | null = null;
  while (target) {
    if ('host' in target && target.host instanceof MathfieldElement) {
      mf = target.host;
      break;
    }
    target = target.parentNode;
  }
  return mf;
}
