"use strict";
exports.__esModule = true;
exports.isHeading = exports.isDivider = exports.isCommand = exports.isSubmenu = void 0;
function isSubmenu(item) {
    return 'submenu' in item;
}
exports.isSubmenu = isSubmenu;
function isCommand(item) {
    return (('type' in item && item.type === 'command') ||
        'onMenuSelect' in item ||
        'id' in item);
}
exports.isCommand = isCommand;
function isDivider(item) {
    return 'type' in item && item.type === 'divider';
}
exports.isDivider = isDivider;
function isHeading(item) {
    return 'type' in item && item.type === 'heading';
}
exports.isHeading = isHeading;
