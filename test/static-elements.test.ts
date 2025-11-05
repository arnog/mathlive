import { describe, expect, it, beforeAll } from '@jest/globals';
import '../src/mathlive';

describe('MathSpanElement', () => {
  let container: HTMLDivElement;

  beforeAll(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should be defined as a custom element', () => {
    expect(customElements.get('math-span')).toBeDefined();
  });

  it('should render simple LaTeX inline', () => {
    const span = document.createElement('math-span');
    span.textContent = 'x^2 + y^2 = z^2';
    container.appendChild(span);

    // Wait for rendering
    span.render();

    // Check that shadow root exists and has content
    expect(span.shadowRoot).toBeTruthy();
    const renderContainer = span.shadowRoot?.querySelector('[part="render"]');
    expect(renderContainer).toBeTruthy();
    expect(renderContainer?.innerHTML).toContain('ML__latex');
  });

  it('should use textstyle by default', () => {
    const span = document.createElement('math-span');
    expect(span.mode).toBe('textstyle');
  });

  it('should support displaystyle mode override', () => {
    const span = document.createElement('math-span');
    span.setAttribute('mode', 'displaystyle');
    expect(span.mode).toBe('displaystyle');
  });

  it('should support format attribute - latex (default)', () => {
    const span = document.createElement('math-span');
    expect(span.format).toBe('latex');
  });

  it('should support letter-shape-style attribute', () => {
    const span = document.createElement('math-span');
    span.letterShapeStyle = 'iso';
    expect(span.getAttribute('letter-shape-style')).toBe('iso');
    expect(span.letterShapeStyle).toBe('iso');
  });

  it('should support min-font-scale attribute', () => {
    const span = document.createElement('math-span');
    span.minFontScale = 0.5;
    expect(span.getAttribute('min-font-scale')).toBe('0.5');
    expect(span.minFontScale).toBe(0.5);
  });

  it('should support max-matrix-cols attribute', () => {
    const span = document.createElement('math-span');
    span.maxMatrixCols = 10;
    expect(span.getAttribute('max-matrix-cols')).toBe('10');
    expect(span.maxMatrixCols).toBe(10);
  });

  it('should support macros attribute as JSON string', () => {
    const span = document.createElement('math-span');
    const macrosObj = { myMacro: '\\\\text{custom}' };
    span.macros = JSON.stringify(macrosObj);
    expect(span.macros).toBe(JSON.stringify(macrosObj));
  });

  it('should re-render when render() is called', () => {
    const span = document.createElement('math-span');
    span.textContent = 'a + b';
    container.appendChild(span);
    span.render();

    const renderContainer = span.shadowRoot?.querySelector('[part="render"]');
    const firstContent = renderContainer?.innerHTML;

    // Change content
    span.textContent = 'c + d';
    span.render();

    const secondContent = renderContainer?.innerHTML;
    expect(firstContent).not.toBe(secondContent);
  });

  it('should dispatch render event on successful render', (done) => {
    const span = document.createElement('math-span');
    span.textContent = 'x + y';

    span.addEventListener('render', (event: Event) => {
      const customEvent = event as CustomEvent;
      expect(customEvent.detail).toBeDefined();
      expect(customEvent.detail.format).toBe('latex');
      expect(customEvent.detail.content).toBe('x + y');
      done();
    });

    container.appendChild(span);
    span.render();
  });

  it('should show original content on render error', () => {
    const span = document.createElement('math-span');
    span.textContent = '\\invalid{{{';
    container.appendChild(span);
    span.render();

    const errorFallback = span.shadowRoot?.querySelector('[part="error"]');
    expect(errorFallback).toBeTruthy();

    // Error fallback should be visible
    const errorDisplay = (errorFallback as HTMLElement)?.style.display;
    expect(errorDisplay).not.toBe('none');
  });

  it('should dispatch render-error event on error', (done) => {
    const span = document.createElement('math-span');
    span.textContent = '\\invalid{{{';

    span.addEventListener('render-error', (event: Event) => {
      const customEvent = event as CustomEvent;
      expect(customEvent.detail).toBeDefined();
      expect(customEvent.detail.error).toBeDefined();
      expect(customEvent.detail.content).toBe('\\invalid{{{');
      done();
    });

    container.appendChild(span);
    span.render();
  });

  it('should handle empty content gracefully', () => {
    const span = document.createElement('math-span');
    span.textContent = '';
    container.appendChild(span);
    span.render();

    const renderContainer = span.shadowRoot?.querySelector(
      '[part="render"]'
    ) as HTMLElement;
    expect(renderContainer?.style.display).toBe('none');
  });

  it('should be accessible via TypeScript types', () => {
    const span: MathSpanElement = document.createElement('math-span');
    expect(span instanceof HTMLElement).toBe(true);
  });
});

describe('MathDivElement', () => {
  let container: HTMLDivElement;

  beforeAll(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should be defined as a custom element', () => {
    expect(customElements.get('math-div')).toBeDefined();
  });

  it('should render LaTeX as block element', () => {
    const div = document.createElement('math-div');
    div.textContent = '\\int_0^\\infty e^{-x^2} dx';
    container.appendChild(div);

    div.render();

    expect(div.shadowRoot).toBeTruthy();
    const renderContainer = div.shadowRoot?.querySelector('[part="render"]');
    expect(renderContainer).toBeTruthy();
    expect(renderContainer?.innerHTML).toContain('ML__latex');
  });

  it('should use displaystyle by default', () => {
    const div = document.createElement('math-div');
    expect(div.mode).toBe('displaystyle');
  });

  it('should support textstyle mode override', () => {
    const div = document.createElement('math-div');
    div.setAttribute('mode', 'textstyle');
    expect(div.mode).toBe('textstyle');
  });

  it('should use flex display for block layout', () => {
    const div = document.createElement('math-div');
    div.textContent = 'x + y';
    container.appendChild(div);
    div.render();

    const renderContainer = div.shadowRoot?.querySelector(
      '[part="render"]'
    ) as HTMLElement;
    expect(renderContainer?.style.display).toBe('flex');
  });

  it('should support all layout options like MathSpanElement', () => {
    const div = document.createElement('math-div');
    div.letterShapeStyle = 'french';
    div.minFontScale = 0.8;
    div.maxMatrixCols = 5;

    expect(div.letterShapeStyle).toBe('french');
    expect(div.minFontScale).toBe(0.8);
    expect(div.maxMatrixCols).toBe(5);
  });

  it('should re-render when attributes change', () => {
    const div = document.createElement('math-div');
    div.textContent = '\\sum_{i=1}^n i';
    container.appendChild(div);
    div.render();

    const renderContainer = div.shadowRoot?.querySelector('[part="render"]');
    const firstContent = renderContainer?.innerHTML;

    // Change mode
    div.mode = 'textstyle';

    const secondContent = renderContainer?.innerHTML;
    // Content should have changed due to different mathstyle
    expect(firstContent).not.toBe(secondContent);
  });

  it('should be accessible via TypeScript types', () => {
    const div: MathDivElement = document.createElement('math-div');
    expect(div instanceof HTMLElement).toBe(true);
  });

  it('should handle complex formulas', () => {
    const div = document.createElement('math-div');
    div.textContent = `
      \\begin{pmatrix}
        a & b \\\\
        c & d
      \\end{pmatrix}
    `;
    container.appendChild(div);

    expect(() => div.render()).not.toThrow();

    const renderContainer = div.shadowRoot?.querySelector('[part="render"]');
    expect(renderContainer?.innerHTML).toBeTruthy();
  });
});

describe('Format support', () => {
  it('should support ascii-math format for math-span', () => {
    const span = document.createElement('math-span');
    span.setAttribute('format', 'ascii-math');
    span.textContent = 'x^2 + y^2';

    expect(span.format).toBe('ascii-math');
    // Note: actual rendering requires ascii-math module to be loaded
  });

  it('should support math-json format for math-div', () => {
    const div = document.createElement('math-div');
    div.setAttribute('format', 'math-json');
    div.textContent = JSON.stringify(['Add', 'x', 'y']);

    expect(div.format).toBe('math-json');
    // Note: actual rendering requires math-json module to be loaded
  });
});

describe('Integration', () => {
  it('should work together - mixed inline and block elements', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <p>
        The formula <math-span>E = mc^2</math-span> represents
        Einstein's mass-energy equivalence.
      </p>
      <math-div>E = mc^2</math-div>
    `;

    const span = container.querySelector('math-span') as MathSpanElement;
    const div = container.querySelector('math-div') as MathDivElement;

    expect(span).toBeTruthy();
    expect(div).toBeTruthy();
    expect(span.mode).toBe('textstyle');
    expect(div.mode).toBe('displaystyle');
  });
});
