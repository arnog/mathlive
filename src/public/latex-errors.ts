/**
 * Raised when LaTeX input exceeds a parser resource budget: the length of
 * the input, the number of tokens, or the nesting depth of the parse.
 *
 * This class is declared in `src/public/` because the build publishes only
 * the type declarations of the files in this directory.
 *
 * @category Conversion
 */
export class LatexResourceLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LatexResourceLimitError';
  }
}
