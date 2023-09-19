
The vue/compiler-sfc parse function will output the following when given a .vue file

```js
{
  descriptor: {
    filename: 'anonymous.vue',
    source: '<script lang="ts">\n' +
      'import { Options, Prop, Vue } from "vue-property-decorator";\n' +
      '\n' +
      '@Options({})\n' +
      'export default class AdminMessages extends Vue {\n' +
      '  @Prop() errMsg: string;\n' +
      '  @Prop() successMsg: string;\n' +
      '}\n' +
      '</script>\n' +
      '\n' +
      '<template>\n' +
      '  <div class="admin-messages__messages">\n' +
      '    <div class="admin-messages__error-message" v-if="errMsg">{{ errMsg }}</div>\n' +
      '    <div class="admin-messages__success-message" v-if="successMsg">{{ successMsg }}</div>\n' +
      '  </div>\n' +
      '</template>\n' +
      '\n' +
      '<style lang="less">\n' +
      '@import (reference) "~@/less/stylesheets/main.less";\n' +
      '.admin-messages__messages {\n' +
      '  height: 20px;\n' +
      '  font-size: 14px;\n' +
      '  padding-bottom: 40px;\n' +
      '}\n' +
      '\n' +
      '.admin-messages__success-message {\n' +
      '  color: @blue-font;\n' +
      '}\n' +
      '\n' +
      '.admin-messages__error-message {\n' +
      '  color: @alert-danger-unauth-font-color;\n' +
      '}\n' +
      '</style>\n',
    template: {
      type: 'template',
      content: '\n' +
        '  <div class="admin-messages__messages">\n' +
        '    <div class="admin-messages__error-message" v-if="errMsg">{{ errMsg }}</div>\n' +
        '    <div class="admin-messages__success-message" v-if="successMsg">{{ successMsg }}</div>\n' +
        '  </div>\n',
      loc: [Object],
      attrs: {},
      ast: [Object],
      map: [Object]
    },
    script: {
      type: 'script',
      content: '\n' +
        'import { Options, Prop, Vue } from "vue-property-decorator";\n' +
        '\n' +
        '@Options({})\n' +
        'export default class AdminMessages extends Vue {\n' +
        '  @Prop() errMsg: string;\n' +
        '  @Prop() successMsg: string;\n' +
        '}\n',
      loc: {
          source: '\n' +
            'import { Options, Prop, Vue } from "vue-property-decorator";\n' +
            '\n' +
            '@Options({})\n' +
            'export default class AdminMessages extends Vue {\n' +
            '  @Prop() errMsg: string;\n' +
            '  @Prop() successMsg: string;\n' +
            '}\n',
          start: { column: 19, line: 1, offset: 18 },
          end: { column: 1, line: 9, offset: 203 }
      },
      attrs: [Object],
      lang: 'ts',
      map: [Object]
    },
    scriptSetup: null,
    styles: [ [Object] ],
    customBlocks: [],
    cssVars: [],
    slotted: false,
    shouldForceReload: [Function: shouldForceReload]
  },
  errors: []
}
```

The `loc` object start offset appears to include the script element text, hence
the offset of 18. The offset for the end seems to indicate where the cursor
would be if the new lines were removed (though it would still be at the end of
the `</script>` tag not the inside).

