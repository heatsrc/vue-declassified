import { VxImportModule } from "@/types.js";
import ts from "typescript";

export function isString(val: unknown): val is string {
  return typeof val === "string";
}

export function printStatementsToString(statements: ts.Statement[], source: ts.SourceFile) {
  const printer = ts.createPrinter();
  const newSourceFile = ts.factory.updateSourceFile(source, statements);
  const result = printer.printFile(newSourceFile);
  return result;
}

export function namedImports(names: string[], external?: string): VxImportModule[] {
  external = external || "vue";
  return [
    {
      named: names,
      external,
    },
  ];
}
