/**
 * Math environment is a collection of settings that are used to configure the math rendering and thay may apply even when there is no mathfield (i.e. in SSR).
 */
export const _MathEnvironment: {
  fractionNavigationOrder: 'denominator-numerator' | 'numerator-denominator';
} = {
  fractionNavigationOrder: 'numerator-denominator',
};
