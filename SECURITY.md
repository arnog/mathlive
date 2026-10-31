# Security Policy

## Supported Versions

Security updates are provided for the last published version and the version in the main branch.

## Reporting a Vulnerability

To report a vulnerability, file an issue at 
[https://github.com/arnog/mathlive/issues](https://github.com/arnog/mathlive/issues). 

Include "SECURITY" in the title of the issue.

The issue will be reviewed within 72 hours.

## Virtual Keyboard Integration

Keyboard messages default to same-origin validation. Explicitly allow only
trusted origins when sharing a keyboard across frames, and use exact
`targetOrigin` values. See the [iframe example](examples/iframe/README.md)
for configuration and the isolated `sandboxed` keyboard policy.

Cross-window messages cannot supply custom layouts or keycap overrides,
including same-origin messages and when `originValidator` is `"none"`.
Configure these in the keyboard's host window. Custom layouts, labels and
keycaps support HTML and must be treated as trusted application code. Never
pass untrusted content directly to these APIs.

`MathfieldElement.createHTML` is an integration hook, not a built-in sanitizer.
Its default implementation returns the supplied HTML unchanged. A Trusted
Types policy that simply returns its input does not sanitize that input.
