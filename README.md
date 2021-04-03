<div align="center">
    <img alt="math live" src="assets/mathlive-1.png?raw=true">
</div>

# MathLive: A Web Component for Math Input

<p align="center">
    <img width="479" alt="Screenshot" src="assets/screenshots/mathlive-demo.png">
</p>

- [x] A Web Component easy to integrate in your project, regardless of the
      framework you use (or even if you use no framework)
- [x] Beautiful, TeX-quality typesetting
- [x] Easy to use interface for formula editing
- [x] Designed for mobile devices with an extensive set of virtual keyboards
- [x] Accessility support: screen reader compatible, and includes custom
      math-to-speech support
- [x] Outputs **LaTeX**, **MathML** and **MathJSON** (Abstract Syntax Tree)
- [x] And it is easy to customize to your needs!

[![Maintenance](https://img.shields.io/maintenance/yes/2021.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)
[![Build Status](https://travis-ci.org/arnog/mathlive.svg?branch=master)](https://travis-ci.org/arnog/mathlive)
[![David](https://img.shields.io/david/dev/arnog/mathlive.svg)]()

Documentation and guides at
[cortexjs.io/mathlive](http://cortexjs.io/mathlive/). Try it at
[mathlive.io](https://mathlive.io).

<table align="center" >
    <tr>
        <td width='50%' align='center' style="border:none;">
            <img alt="The popover panel" 
            style='margin:15px; box-shadow: 0px 5px 15px #000; border: 1px solid #eee' 
            src="assets/screenshots/popover.png">
        </td>
        <td width='50%' align='center' style="border:none;">
            <img alt="A Virtual Keyboard" 
            style='margin:15px; box-shadow: 0px 5px 15px #000; border: 1px solid #eee' 
            src="assets/screenshots/virtualKeyboard.png">
        </td>
    </tr>
    <tr style="background-color: initial; border: none;">
        <td colspan="2" align="center" style="border:none;">
            <img width="50%" alt="The Loop Equation" 
            style='margin:15px; box-shadow: 0px 5px 15px #000; border: 1px solid #eee' 
            src="assets/screenshots/loop-eqn.png">
        </td>
    </tr>
</table>

## Using MathLive

### Editing Math

To add a mathfield element in your page use a `<math-field>` tag. It works just
like a `<textarea>` or `<button>`. You can manipulate the mathfield using
methods of the element and listen for events to be notified when its internal
state changes.

```html
<!DOCTYPE html>
<html lang="en-US">
  <body>
    <math-field>f(x)=</math-field>
    <script src="https://unpkg.com/mathlive/dist/mathlive.min.js"></script>
  </body>
</html>
```

### Displaying Static Math

Render static math equations by
[adding two lines to your web page](tutorials/USAGE_GUIDE.md).

```html
<!DOCTYPE html>
<html lang="en-US">
  <body>
    <h1>Euler's Identity</h1>
    <p>$$e^{i\pi} + 1 = 0$$</p>

    <script type="module">
      import { renderMathInDocument } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';
      renderMathInDocument();
    </script>
  </body>
</html>
```

## Documentation

<dl>
  <dt><a href="https://cortexjs.io/mathlive/guides/introduction">Quick Start</a></dt>
  <dd>Quick introduction to using MathLive in your project</dd>  
  <dt><a href="https://cortexjs.io/mathlive/guides/interacting">Interact with a mathfield</a></dt>
  <dd>Receiving input and changing the value of a mathfield</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/customizing">Customize a mathfield</a></dt>
  <dd>Adapting the behavior and appearance of a mathfield to your needs</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/commands">Executing commands</a></dt>
  <dd>Sending editing commands to a mathfield</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/macros">Define custom Latex macros</a></dt>
  <dd>Extending the Latex commands supported</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/shortcuts">Manage inline and keyboard shortcuts</a></dt>
  <dd>Add or modify editing keyboard shortcuts</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/speech">Control speech output</a></dt>
  <dd>A mathfield can provide speech feedback to interact with it.</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/static">Display static math formulas</a></dt>
  <dd>Display non-editable math formulas in a page</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/virtual-keyboards">Define custom virtual keyboards</a></dt>
  <dd>Virtual (on-screen) keyboards can be customized to your needs</dd>
  <hr>
  <dt><a href="https://cortexjs.io/guides/mathfield-getting-started">Getting Started</a></dt>
  <dd>Everything you need to know to add a mathfield to your project</dd>  
  <dt><a href="https://cortexjs.io/docs/mathlive">MathLive SDK</a></dt>
  <dd>Reference documentation of the MathLive API</dd>

</dl>

## Contact Us

- Join our [Gitter community](https://gitter.im/cortex-js/community)
- Drop a line to arno@arno.org or
  [/u/real_arnog](https://www.reddit.com/user/real_arnog)

## License

This project is licensed under the [MIT License](LICENSE.txt).
