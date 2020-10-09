# Virtual Keyboards

## JSON keyboard layout

There is option to load keyboard from JSON file.
Simple JSON structure is:

```json
{
    "virtualKeyboardMode": "manual",
    "customVirtualKeyboardLayers": {
        "layer-name": {
            "styles": "",
            "rows": [
                [
                    {
                        "class": "keycap",
                        "latex": "\\frac{x}{y}"
                    }
                ]
            ]
        }
    },
    "customVirtualKeyboards": {
        "keyboard-name": {
            "label": "Json",
            "tooltip": "Json keyboard",
            "layer": "layer-name"
        }
    },
    "virtualKeyboards": "keyboard-name"
}
```

Full button JSON example:

```json
{
    "class": "",
    "insert": "",
    "key": "",
    "latex": "",
    "aside": "",
    "altKeys": "",
    "shifted": "",
    "shiftedCommand": "",
    "command": "",
    "label": ""
}
```

There are three modes of keyboard that can be set

`"virtualKeyboardMode": "manual"` will add button to hide/show keyboard
`"virtualKeyboardMode": "onfocus"` will open keyboard when editor field is focused
`"virtualKeyboardMode": "off"` will disable keyboard
