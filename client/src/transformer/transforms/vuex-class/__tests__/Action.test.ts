import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Action decorator", () => {
  it("should transform action decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Action foo: () => void;
        @ns1.Action baz: () => void;
        @ns2.Action qux: () => void;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const foo = async (): Promise<void> => store.dispatch(\\"foo\\");
      const baz = async (): Promise<void> => store.dispatch(\\"moduleB/baz\\");
      const qux = async (): Promise<void> => store.dispatch(\`\${moduleC}/qux\`);
      "
    `);
  });

  it("should transform action decorator with action name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Action('bar') foo: () => void;
        @ns1.Action('bar') baz: () => void;
        @ns2.Action('bar') qux: () => void;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const foo = async (): Promise<void> => store.dispatch('bar');
      const baz = async (): Promise<void> => store.dispatch(\\"moduleB/bar\\");
      const qux = async (): Promise<void> => store.dispatch(\`\${moduleC}/bar\`);
      "
    `);
  });

  it("should transform action decorator with action name and namespace", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Action('baz/foo') foo: () => void;
        @ns1.Action('baz/foo') baz: () => void;
        @ns2.Action('baz/foo') qux: () => void;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const foo = async (): Promise<void> => store.dispatch('baz/foo');
      const baz = async (): Promise<void> => store.dispatch(\\"moduleB/baz/foo\\");
      const qux = async (): Promise<void> => store.dispatch(\`\${moduleC}/baz/foo\`);
      "
    `);
  });

  it("should transform action decorator return type", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Action('baz/foo') foo: () => string;
        @ns1.Action('baz/foo') baz: () => string;
        @ns2.Action('baz/foo') qux: () => string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const foo = async (): Promise<string> => store.dispatch('baz/foo');
      const baz = async (): Promise<string> => store.dispatch(\\"moduleB/baz/foo\\");
      const qux = async (): Promise<string> => store.dispatch(\`\${moduleC}/baz/foo\`);
      "
    `);
  });

  it("should transform action decorator with variable action name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      const foo = 'foo';
      const keys = {actions: { foo: 'foo' } };
      @Component
      export default class Foo {
        @Action(foo) bar: (a: string) => void;
        @ns1.Action(foo) baz: (a: string) => void;
        @ns2.Action(foo) qux: (a: string) => void;
        @Action(keys.actions.foo) ipsa: (a: string) => void;
        @ns1.Action(keys.actions.foo) eveniet: (a: string) => void;
        @ns2.Action(keys.actions.foo) inventore: (a: string) => void;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const foo = 'foo';
      const keys = { actions: { foo: 'foo' } };
      const store = useStore();
      const bar = async (a: string): Promise<void> => store.dispatch(foo, a);
      const baz = async (a: string): Promise<void> => store.dispatch(\`moduleB/\${foo}\`, a);
      const qux = async (a: string): Promise<void> => store.dispatch(\`\${moduleC}/\${foo}\`, a);
      const ipsa = async (a: string): Promise<void> => store.dispatch(keys.actions.foo, a);
      const eveniet = async (a: string): Promise<void> => store.dispatch(\`moduleB/\${keys.actions.foo}\`, a);
      const inventore = async (a: string): Promise<void> => store.dispatch(\`\${moduleC}/\${keys.actions.foo}\`, a);
      "
    `);
  });

  it("should add todo if function signature is missing", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Action foo;
        @ns1.Action baz;
        @ns2.Action qux;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      /* [VUEDC_TODO]: Check function dispatch call signature.*/ const foo = async (...args: unknown[]): Promise<unknown> => store.dispatch(\\"foo\\", args);
      /* [VUEDC_TODO]: Check function dispatch call signature.*/ const baz = async (...args: unknown[]): Promise<unknown> => store.dispatch(\\"moduleB/baz\\", args);
      /* [VUEDC_TODO]: Check function dispatch call signature.*/ const qux = async (...args: unknown[]): Promise<unknown> => store.dispatch(\`\${moduleC}/qux\`, args);
      "
    `);
  });

  it.each(["", "ns1.", "ns2."])("should throw if duplicate action decorator", (prefix) => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action, namespace} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @${prefix}Action @${prefix}Action foo: () => void;
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      "[vuex-class] Duplicate @Action decorators for foo",
    );
  });

  it.each(["", "ns1.", "ns2."])(
    "should throw if function signature contains more than 1 parameter",
    (prefix) => {
      const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @${prefix}Action foo: (a: string, b: string) => void;
      }
    `);
      expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
        "[vuex-class] foo dispatch signature has more than 1 parameter.",
      );
    },
  );
});
