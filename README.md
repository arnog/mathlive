<div align="center">
    <img alt="math live" src="assets/mathlive-1.png?raw=true">
</div>

<h3><strong>MathLive</strong></h3>
<h1>A Web Component for Math Input</h1>

<img src="assets/screenshots/mathlive-demo.png">

[![Maintenance](https://img.shields.io/maintenance/yes/2023.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)
[![Build Status](https://travis-ci.org/arnog/mathlive.svg?branch=master)](https://travis-ci.org/arnog/mathlive)

- [x] A **Web Component**, easy to integrate in your project, regardless of the
      framework you use, or even if you just use plain JavaScript
- [x] Edit **math formulas** with an easy to use interface
- [x] Beautiful, **TeX-quality** typesetting: over 800 built-in LaTeX commands
- [x] Designed for **mobile devices** with an extensive set of **virtual
      keyboards** for math input
- [x] Compatible with **screen readers**, and includes custom math-to-speech
      support for improved **accessibility**
- [x] Output to **LaTeX**, **MathML**, **ASCIIMath** and **MathJSON** (Abstract
      Syntax Tree) formats
- [x] And it is easy to **customize** to your needs!

Reference documentation and guides at
[cortexjs.io/mathlive](https://cortexjs.io/mathlive/).

Try it at [cortexjs.io/mathlive/demo/](https://cortexjs.io/mathlive/demo/).

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

**To add a mathfield element to your page** use a `<math-field>` tag.

It works just like a `<textarea>` or `<button>` element. You can manipulate the
mathfield using methods of the element and listen for events to be notified when
its internal state changes.

```html
<!DOCTYPE html>
<html lang="en-US">
  <body>
    <math-field>f(x)=</math-field>
    <script src="https://unpkg.com/mathlive"></script>
  </body>
</html>
```

## Documentation

<dl>
  <dt><a href="https://cortexjs.io/mathlive/guides/getting-started/">Quick Start</a></dt>
  <dd>Quick introduction to using MathLive in your project</dd>  
  <dt><a href="https://cortexjs.io/mathlive/guides/interacting">Interact with a mathfield</a></dt>
  <dd>Receive input and change the value of a mathfield</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/customizing">Customize a mathfield</a></dt>
  <dd>Adapt the behavior and appearance of a mathfield to your needs</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/commands">Execute commands</a></dt>
  <dd>Send editing commands to a mathfield</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/macros">Define custom LaTeX macros</a></dt>
  <dd>Extend the LaTeX commands supported</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/shortcuts">Manage inline and keyboard shortcuts</a></dt>
  <dd>Add or modify editing keyboard shortcuts</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/speech">Control speech output</a></dt>
  <dd>A mathfield can provide speech feedback to interact with it.</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/static">Display static math formulas</a></dt>
  <dd>Display non-editable math formulas in your page</dd>
  <dt><a href="https://cortexjs.io/mathlive/guides/virtual-keyboards">Define custom virtual keyboards</a></dt>
  <dd>Customize or create new virtual (on-screen) keyboards</dd>
  <hr>
  <dt><a href="https://cortexjs.io/mathlive/guides/integration/">Getting Started</a></dt>
  <dd>Everything you need to integrate the MathLive library to your project</dd>  
  <dt><a href="https://cortexjs.io/docs/mathlive">MathLive SDK</a></dt>
  <dd>Reference documentation of the MathLive API</dd>
</dl>

## Related Projects

<dl>
  <dt><a href="https://cortexjs.io/math-json">MathJSON</a> (on <a href="https://github.com/cortex-js/math-json">GitHub</a>)</dt>
  <dd>A lightweight data interchange format for mathematical notation.</dd>  
  <dt><a href="https://cortexjs.io/compute-engine">Compute Engine</a> (on <a href="https://github.com/cortex-js/math-json/tree/master/src/compute-engine">GitHub</a>)</dt>
  <dd>The CortexJS Compute Engine performs calculations on MathJSON expressions</dd>  
  <dt><a href="https://cortexjs.io/cortex">Cortex</a> (on <a href="https://github.com/cortex-js/math-json/tree/master/src/cortex">GitHub</a>)</dt>
  <dd>Cortex is a programming language for scientific computing</dd>  
</dl>

## Contact Us

- Join our [Gitter community](https://gitter.im/cortex-js/community)
- Drop a line to arno@arno.org

## License

This project is licensed under the [MIT License](LICENSE.txt).
