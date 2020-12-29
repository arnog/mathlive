// This tells Typescript that any modules that ends in a '.less' extension
// should be imported as a simple string
// Without this, Typescript (and VSCode) will complain on
// `import style from 'style.less'`

declare module '*.less' {
  const content: string;
  export default content;
}
