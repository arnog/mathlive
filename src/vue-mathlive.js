export default {
  name: 'mathlive-mathfield',
  template: '<math-field :id="id"><slot></slot></math-field>',
  props: {
    id: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
  },
  /*
   * To register this component, call:
   * ```
   *     import * as MathLive from './mathlive.mjs';
   *     import MathfieldComponent from './vue-mathlive.mjs';
   *     Vue.use(MathfieldComponent, MathLive);
   * ```
   *
   * The HTML tag for this component is `<mathlive-mathfield>`
   *
   * @param {object} vue - This module, as returned from an import statement
   * @param {object} mathlive - The MathLive module, as returned from an import
   * statement
   */
  install(vue, mathlive) {
    // When the component is installed (with Vue.use()), the first argument
    // should be the component (as received from import) and the second
    // should be the MathLive module (also as received from import).
    // The MathLive module then gets stashed as a property of the Vue
    // object to be accessed later by the component implementation.
    // This allows the user of the component to control which version of
    // the MathLive module gets used.

    if (vue?.version && +vue.version.split('.')[0] >= 3) {
      // Vue >= 3.x
      vue.config.globalProperties.$mathlive = mathlive;
    } else {
      // Vue < 3.x
      Object.defineProperty(vue.prototype, '$mathlive', { value: mathlive });
    }

    vue.component('mathlive-mathfield', this);
  },
  watch: {
    value(newValue) {
      // When the `value` prop (from the model) is modified
      // update the mathfield to stay in sync, but don't send back content
      // change notifications, to avoid infinite loops.
      const oldMathfieldValue = this.$el.getValue();
      if (newValue !== oldMathfieldValue) {
        this.$el.setValue(newValue, {
          silenceNotifications: true,
        });
      }
    },
  },
  mounted() {
    // A new instance is being created
    // Wait until the DOM has been constructed...
    // ... then configure the mathfield
    this.$nextTick(() => {});
  },
  methods: {
    /*
     *
     * @param {string} selector
     */
    executeCommand(selector) {
      this.$el.executeCommand(selector);
    },
    /*
     * @return {boolean}
     */
    hasFocus() {
      return this.$el.hasFocus();
    },
    focus() {
      this.$el.focus();
    },
    blur() {
      this.$el.blur();
    },
    getValue(format) {
      return this.$el.getValue(format);
    },
    insert(text, options) {
      this.$el.insert(text, options);
    },
    select() {
      this.$el.select();
    },
  },
};
