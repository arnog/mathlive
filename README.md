<h1 align="center">
    <img alt="math live" src="assets/logo.png?raw=true">
</h1>

<p align="center">
    <img width="479" alt="Screenshot" src="assets/screenshots/mathlive-demo.png">
</p>

## MathLive: A Web Component for Math Input

-   [x] A Web Component easy to integrate in your project, regardless of the
        framework you use (or even if you use no framework)
-   [x] Beautiful, TeX-quality typesetting
-   [x] Easy to use interface for formula editing
-   [x] Designed for mobile devices with an extensive set of virtual keyboards
-   [x] Accessility support: screen reader compatible, and includes custom math-to-speech support
-   [x] Outputs **LaTeX**, **MathML** and **MathJSON** (Abstract Syntax Tree)
-   [x] And it is easy to customize to your needs!

[![Maintenance](https://img.shields.io/maintenance/yes/2020.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)
[![Build Status](https://travis-ci.org/arnog/mathlive.svg?branch=master)](https://travis-ci.org/arnog/mathlive)
[![David](https://img.shields.io/david/dev/arnog/mathlive.svg)]()

See [cortexjs.io](http://cortexjs.io/mathlive/) for more info or try it at [mathlive.io](https://mathlive.io)

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

To add a mathfield element in your page use a `<math-field>` tag. It works
just like a `<textarea>` or `<button>`. You can manipulate the mathfield using
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

## Want to Help?

-   Using MathLive in your project? Want to support the project ongoing maintenance?
    Consider making a donation with [PayPal](https://www.paypal.me/arnogourdol)
-   Something wrong? Got ideas for new features? Write up an issue. Read about
    [Contributing](CONTRIBUTING.md) and follow our [Code of Conduct](CODE_OF_CONDUCT.md)
-   Want to contribute some code for an issue or a feature? Read the
    [Contributor Guide](tutorials/CONTRIBUTOR_GUIDE.md) and the
    [docs](http://docs.mathlive.io). Looking for inspiration? Pick one of
    the [good first issues](https://github.com/arnog/mathlive/labels/good%20first%20issue)

## More Questions?

-   Read the [Getting Started Guide](http://cortexjs.io/guides/mathfield-getting-started/)
-   Look at some [examples](http://cortexjs.io/mathlive/)
-   [Read the API documentation](https://cortexjs.io/docs/mathlive/)
-   Join our [Gitter community](https://gitter.im/cortex-js/community)
-   Drop a line to arno@arno.org or [/u/real_arnog](https://www.reddit.com/user/real_arnog)

## License

This project is licensed under the [MIT License](LICENSE.txt).
