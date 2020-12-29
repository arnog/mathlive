export default {
  name: 'mathlive-mathfield',
  template: '<div class="mathfield" :id="id"><slot></slot></div>',
  props: {
    id: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    onKeystroke: {
      type: Function,
      default(_keystroke, _ev) {
        return true;
      },
    },
    onMoveOutOf: {
      type: Function,
      default(_direction) {
        return true;
      },
    },
    onTabOutOf: {
      type: Function,
      default(_direction) {
        return true;
      },
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
    Object.defineProperty(vue.prototype, '$mathlive', { value: mathlive });
    vue.component('mathlive-mathfield', this);
  },
  watch: {
    value(newValue, oldValue) {
      // When the `value` prop (from the model) is modified
      // update the mathfield to stay in sync, but don't send back content
      // change notifications, to avoid infinite loops.
      if (newValue !== oldValue) {
        this.$el.mathfield.setValue(newValue, {
          suppressChangeNotifications: true,
        });
      }
    },
    options: {
      deep: true,
      handler(newValue, oldValue) {
        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          this.$el.mathfield.setOptions(newValue);
        }
      },
    },
  },
  mounted() {
    // A new instance is being created
    // Wait until the DOM has been constructed...
    this.$nextTick(() => {
      // ... then make the Mathfield
      this.$mathlive.makeMathField(this.$el, {
        ...this.options,
        // To support the 'model' directive, this handler will connect
        // the content of the mathfield to the ViewModel
        onContentDidChange: (_) => {
          // When the mathfield is updated, notify the model.
          // The initial input value is generated from the <slot>
          // content, so it may need to be updated.
          this.$emit('input', this.$el.mathfield.getValue());
        },
        // Those asynchronous notification handlers are translated to events
        onFocus: (_) => {
          this.$emit('focus');
        },
        onBlur: (_) => {
          this.$emit('blur');
        },
        onUndoStateDidChange: (_, command) => {
          this.$emit('undo-state-did-change', command);
        },
        onReadAloudStatus: (_, status) => {
          this.$emit('read-aloud-status-change', status);
        },

        // Those notification handlers expect an answer back, so translate
        // them to callbacks via props
        onKeystroke: (_, keystroke, ev) => {
          return this.onKeystroke(keystroke, ev);
        },
        onMoveOutOf: (_, direction) => {
          return this.onMoveOutOf(direction);
        },
        onTabOutOf: (_, direction) => {
          return this.onTabOutOf(direction);
        },
      });
    });
  },
  methods: {
    /*
     *
     * @param {string} selector
     */
    executeCommand(selector) {
      this.$el.mathfield.executeCommand(selector);
    },
    /*
     * @return {boolean}
     */
    hasFocus() {
      return this.$el.mathfield.hasFocus();
    },
    focus() {
      this.$el.mathfield.focus();
    },
    blur() {
      this.$el.mathfield.blur();
    },
    getValue(format) {
      return this.$el.mathfield.getValue(format);
    },
    /** @deprecated */
    selectedText(format) {
      return this.$el.mathfield.$selectedText(format);
    },
    insert(text, options) {
      this.$el.mathfield.insert(text, options);
    },
    select() {
      this.$el.mathfield.select();
    },
  },
};
