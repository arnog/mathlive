<div align="center">
    <img alt="math live" src="assets/mathlive-1.png?raw=true">
</div>

<h3><strong>Kedyou's fork of MathLive</strong></h3>
<h1>A Web Component for Math Input</h1>

[![Maintenance](https://img.shields.io/maintenance/yes/2025.svg)]()
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/arnog/mathlive/master/LICENSE.txt)

The MathLive library includes a `<math-field>` web component that provides an
easy-to-use interface for editing math.

With over 800 **built-in LaTeX commands**, mathfields render beautiful,
**TeX-quality typesetting**.

Mathfields are designed for **mobile devices** with an extensive set of virtual
keyboards for math input, and are compatible with screen readers, including
custom math-to-speech support for improved accessibility.

Mathfields output their content as LaTeX, MathML, ASCIIMath, Typst and MathJSON
formats.

And the best part? They're easy to customize to your needs!

<img src="assets/screenshots/mathlive-demo.png">

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

## 🚀 Getting Started

Using MathLive is easy! Simply add a `<math-field>` tag to your page. It
initializes automatically and works just like a `<textarea>` or `<button>`
element. You can manipulate the mathfield using methods of the element and
listen for events to be notified when its internal state changes.

```bash
npm install mathlive
```

```javascript
import 'mathlive';
```

```html
<!DOCTYPE html>
<html lang="en-US">
  <body>
    <math-field>f(x)= x+1</math-field>
  </body>
</html>
```

You can also add it using a CDN:

```html
<head>
    <script src="https://unpkg.com/mathlive"></script>
</head>
```

Check documentation for [React](https://cortexjs.io/mathfield/guides/react/),
[Svelte](https://cortexjs.io/mathfield/guides/svelte/) and
[interaction with Mathfield](https://cortexjs.io/mathfield/guides/interacting/).

## 📖 Documentation

MathLive has an extensive set of documentation to help you get started,
including guides on interacting with a mathfield, customizing it, executing
commands, defining custom LaTeX macros, managing inline and keyboard shortcuts,
controlling speech output, and displaying static math formulas. You can find all
of these guides on the [MathLive.io website](https://mathlive.io/).

In addition to the guides, you can also find reference documentation of the
mathfield API on the
[Mathfield API Reference page](https://mathlive.io/mathfield/api/).

## FAQ

**Q:** When is the next release?

MathLive follows a semi-annual release cycle, with major releases typically
scheduled for June and January. These may be followed by patch releases to
address any issues that arise shortly after deployment. Additionally, an
out-of-band release can be made if requested by a sponsor or if a community
member submits a pull request and requests a release to include their
contribution.

## Related Projects

<dl>
  <dt><a href="https://mathlive.io/math-json">MathJSON</a> (on <a href="https://github.com/cortex-js/math-json">GitHub</a>)</dt>
  <dd>A lightweight data interchange format for mathematical notation.</dd>  
  <dt><a href="https://mathlive.io/compute-engine">Compute Engine</a> (on <a href="https://github.com/cortex-js/math-json/tree/master/src/compute-engine">GitHub</a>)</dt>
  <dd>The MathLive Compute Engine performs numeric and symbolic calculations on MathJSON expressions</dd>  
</dl>

## 💬 Contact Us

- Chat with the [MathLive GPT](https://chatgpt.com/g/g-8YgEfR7ig-mathlive-gpt)
- Join our [Discord server](https://discord.gg/yhmvVeJ4Hd)
- Drop a line to [arno@arno.org](arno@arno.org)

## 📃 License

This project is licensed under the [MIT License](LICENSE.txt).

## Kedyou

The Kedyou modification of MathLive allows users to type multi-lined math
quickly and easily, simplifying the inputs to create and modify aligned
environments.

Update with the latest changes from arnog:

```sh
# Add the remote, call it "upstream":
git remote add upstream https://github.com/arnog/mathlive/
# Fetch all the branches of that remote into remote-tracking branches
git fetch upstream
# Make sure that you're on your master branch:
git checkout master
# Rewrite your master branch so that any commits of yours that
# aren't already in upstream/master are replayed on top of that
# other branch:
git rebase upstream/master
# After finishing rebase/merging changes, force push
git push --force
```

### Local testing

To test the MathLive in Kedyou before publishing, use `pnpm link --global`:

```sh
# In mathlive repo
pnpm link --global
# In the kedyou-frontend repo
pnpm link --global @kedyou/mathlive
```

#### **`sites/frontend/package.json`**
```diff
-"@kedyou/mathlive": "^0.98.6"
+"@kedyou/mathlive": "link:^0.98.6"
```
