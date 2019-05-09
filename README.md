<img alt="math live" src="assets/logo-1024.jpg?raw=true">



[![Maintenance](https://img.shields.io/maintenance/yes/2019.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)

[![Build Status](https://travis-ci.org/arnog/mathlive.svg?branch=master)](https://travis-ci.org/arnog/mathlive)
[![Greenkeeper badge](https://badges.greenkeeper.io/arnog/mathlive.svg)](https://greenkeeper.io/)
[![David](https://img.shields.io/david/dev/arnog/mathlive.svg)]()



<img alt="Screenshot" src="assets/screenshots/screenshot.jpg">


MathLive is a JavaScript library to render and edit math.

- [x] Tex-quality typesetting
- [x] Easy to use interface for math editing
- [x] Fast and small
- [x] Works great on desktop and on mobile devices thanks to an extensive set of virtual keyboards
- [x] Outputs **LaTeX**, **MathML** and **JSON** (Abstract Syntax Tree, MASTON)**
- [x] And it is easy to customize to your needs!

Try it at [mathlive.io](https://mathlive.io)

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


## How To Use MathLive


### To display math
You can use MathLive to simply render math equations by 
[adding a few lines to your web page](tutorials/USAGE_GUIDE.md). 

```html
<!doctype html><html lang="en-US">
<head>
    ...
    <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive.core.css">
    <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive.css">
    <script src="https://unpkg.com/mathlive"></script>
</head>
<body>
    <h1>Euler's Identity</h1>
    <p>$$e^{i\pi} + 1 = 0$$</p> 

    <script> 
        MathLive.renderMathInDocument();
    </script>
</body>
</html>
```


### To edit math
You can also incorporate a “math field” to edit math just like you would edit 
text. The MathLive APIs allow you to interact with the math field,
including extracting its content, inserting placeholders and more.

```html
<!doctype html><html lang="en-US">
<head>
    ...
    <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive.core.css">
    <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive.css">
</head>
<body>
    <div id='mathfield'>f(x)=</div>

    <script type='module'> 
        import MathLive from 'https://unpkg.com/mathlive/dist/mathlive.mjs';
        MathLive.makeMathField('mathfield');
    </script>
</body>
</html>
```

### More examples

More examples are available at https://mathlive.io/deploy/examples/


### Installing MathLive

The examples above use a CDN, which is the fastest and easiest way to get started.
However, if you:
- want to contribute to MathLive
- use your own CDN
- make some other changes to MathLive
you can also install it locally in your project. 

To do so:
```bash
$ npm install -s mathlive
$ npm start
```
This will make a local build of MathLive, run a local HTTP server and open a page with the examples in your browser.

## How You Can Help

* Something wrong? Got ideas for new features? Write up an issue. Read about
[Contributing](CONTRIBUTING.md) and follow our [Code of Conduct](CODE_OF_CONDUCT.md)
* Want to use MathLive in your web page? The [Usage Guide](tutorials/USAGE_GUIDE.md) 
has all the details.
* Want to contribute some code for an issue or a feature? Read the 
[Contributor Guide](tutorials/CONTRIBUTOR_GUIDE.md) and the 
[docs](http://docs.mathlive.io). Looking for inspiration? Pick one of
the [good first issues](https://github.com/arnog/mathlive/labels/good%20first%20issue)

## More Questions?

* Join our Slack channel at https://mathlive.slack.com. 
* Drop a line to arno@arno.org or [/u/real_arnog](https://www.reddit.com/user/real_arnog)

## License

This project is licensed under the [MIT License](LICENSE.txt).
