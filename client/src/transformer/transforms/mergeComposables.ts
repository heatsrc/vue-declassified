import { VxPostProcessor, VxResultKind, VxResultToComposable, VxTransformResult } from "@/types.js";
import ts from "typescript";

export const mergeComposables: VxPostProcessor = (results, program) => {
  const composableResults = results.filter((d): d is VxResultToComposable<ts.Expression> => {
    return !!d && d.kind === VxResultKind.COMPOSABLE;
  });
  const otherResults = results.filter((d): d is VxResultToComposable<ts.Expression> => {
    return !!d && d.kind !== VxResultKind.COMPOSABLE;
  });

  let composableSet = new Set<string>();
  const composables = composableResults.reduce((acc, composable) => {
    if (composableSet.has(composable.tag)) return acc;
    composableSet.add(composable.tag);
    acc.push(composable);
    return acc;
  }, [] as VxTransformResult<ts.Node>[]);
  return [...composables, ...otherResults];
};
