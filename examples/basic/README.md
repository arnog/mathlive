# Basic Example

This example shows how to interact with a MathLive mathfield.

Read more at [MathLive Documentation](https://cortexjs.io/mathlive).

ES Modules, also known as JavaScript Modules, are the recommended way to load
JavaScript libraries. The library is loaded asynchronously, improving loading
performance, and it does not pollute the global environment.

```html
<script type="module">
  import 'https://unpkg.com/mathlive?module';
  // ...
</script>
```

In order to use the `import` statement, the `<script>` tag has an attribute
`type='module'`. Doing so will also require CORS to be respected, which means
that loading directly from a local filesystem will not work, but will require a
local server instead.
