import { MathfieldElement, Keybinding, version } from 'mathlive';

console.log(version);
const bindings: Keybinding[] = [];
const mf = new MathfieldElement({});
mf.keybindings = bindings;
