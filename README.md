<h1 align="center">
    <a href="https://mathlive.io">
        <img src = "https://github.com/arnog/mathlive/blob/master/assets/logo-1024.jpg?raw=true">
    </a>
</h1>


[![Build Status](https://travis-ci.org/arnog/mathlive.svg?branch=master)](https://travis-ci.org/arnog/mathlive)
[![David](https://img.shields.io/david/dev/arnog/mathlive.svg)]()
[![Greenkeeper badge](https://badges.greenkeeper.io/arnog/mathlive.svg)](https://greenkeeper.io/)
[![Maintenance](https://img.shields.io/maintenance/yes/2017.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)

MathLive is a Javascript library to render and edit math. 

It is fast, small and provides TeX-quality typesetting 
with an easy to use interface for math editing. Try it at [mathlive.io](https://mathlive.io)!

<table align="center" >
    <tr>
        <td width='50%' align='center' style="border:none;">
            <img alt="The popover panel" 
            style='margin:15px; box-shadow: 0px 5px 15px #ddd; border: 1px solid #eee' 
            src="assets/screenshots/popover.png">
        </td>
        <td width='50%' align='center' style="border:none;">
            <img alt="The command bar panel" 
            style='margin:15px; box-shadow: 0px 5px 15px #ddd; border: 1px solid #eee' 
            src="assets/screenshots/commandbar.png">
        </td>
    </tr>
    <tr style="background-color: initial; border: none;">
        <td colspan="2" align="center" style="border:none;">
            <img width="50%" alt="The Loop Equation" 
            style='margin:15px; box-shadow: 0px 5px 15px #ddd; border: 1px solid #eee' 
            src="assets/screenshots/loop-eqn.png">
        </td>
    </tr>
</table>


## How To Use MathLive


### To display math
You can use MathLive to simply render math equations by 
[adding a few lines to your web page](USAGE_GUIDE.md). 

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

    <script src="mathlive.js"></script>
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
<!DOCTYPE html><html lang="en-US">
<head>
    ...
    <link rel="stylesheet" href="mathlive/mathlive.core.css">
    <link rel="stylesheet" href="mathlive/mathlive.css">
</head>
<body>
    <div id='mathfield'>
        f(x)=
    </div>

    <script src="mathlive/mathlive.js"></script>
    <script>
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
those open issues for [beginners](https://github.com/arnog/mathlive/labels/BEGINNER)

## More Questions?

* Join our Slack channel at https://mathlive.slack.com. 
* Drop a line to arno@arno.org or tweet [@arnog](https://twitter.com/arnog).

## License

This project is licensed under the [MIT License](LICENSE.txt).
