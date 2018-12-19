<img alt="math live" src="assets/logo-1024.jpg?raw=true">



[![Maintenance](https://img.shields.io/maintenance/yes/2018.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)

[![Build Status](https://travis-ci.org/arnog/mathlive.svg?branch=master)](https://travis-ci.org/arnog/mathlive)
[![Greenkeeper badge](https://badges.greenkeeper.io/arnog/mathlive.svg)](https://greenkeeper.io/)
[![David](https://img.shields.io/david/dev/arnog/mathlive.svg)]()



<img alt="Screenshot" style='margin:15px;' src="assets/screenshots/screenshot.jpg">


MathLive is a JavaScript library to render and edit math.
* Fast and small
* <span style="font-family: Times, 'Times New Roman', serif">T<sub style="vertical-align:-0.5ex;margin-left: -0.1667em;margin-right: -0.125em;">E</sub></span>X-quality typesetting
* Easy to use interface for math editing
* Works great on desktop and on mobile devices thanks to an extensive set of virtual keyboards. 
* Comprehensive APIs, including generation of <span style="font-family: Times, 'Times New Roman', serif">L<sup style="letter-spacing: 1px;font-size: 0.85em;vertical-align: 0.15em;margin-left: -0.36em;margin-right: -0.15em">A</sup>T<sub style="vertical-align:-0.5ex;margin-left: -0.1667em;margin-right: -0.125em;">E</sub>X</span>, **MathML** and **Abstract Syntax Tree (MASTON)**
* And it is easy to customize to your needs! Try it at [mathlive.io](https://mathlive.io)!

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
    <link rel="stylesheet" href="mathlive.core.css">
    <link rel="stylesheet" href="mathlive.css">
</head>
<body>
    <h1>Euler's Identity</h1>
    <p>$$e^{i\pi} + 1 = 0$$</p> 

    <script type='module'> 
        import MathLive from 'dist/mathlive.mjs';
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
<!DOCTYPE html><html lang="en-US">
<head>
    ...
    <link rel="stylesheet" href="mathlive/mathlive.core.css">
    <link rel="stylesheet" href="mathlive/mathlive.css">
</head>
<body>
    <div id='mathfield'>f(x)=</div>

    <script type='module'> 
        import MathLive from 'dist/mathlive.mjs';
        const mathfield = MathLive.makeMathField('mathfield');
    </script>
</body>
</html>
```

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
