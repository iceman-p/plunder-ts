import { Kind, Nat, Fan } from "./types"
import * as p from '../src/index';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export enum RunKind {
  LOG,
  CNS,
  REF,
  KAL,
  LET
}

// Intermediate form for the compiler.
//
export type Run =
  | { t: RunKind.LOG, l: string, r: Run }
  | { t: RunKind.CNS, c: Fan }
  | { t: RunKind.REF, r: string }
  | { t: RunKind.KAL, f: Run, x: Run }
//  | { t: RunKind.LET, i: string, v: Run, f: Run }

// Collect all let statements in a function and hoist them to the top.
export type TopLet = { i: string, v: Run }

// copy pasted from index.ts, figure out how to unify.
function whnf(f : Fan) : Fan {
  if (f.t == Kind.THUNK) {
    f.x();
  }
  if (f.t == Kind.THUNK) {
    throw "NO WHNF AFTER EVAL";
  }
  return f;
}

export function fanToRun(maxArg : number,
                         val : Fan) : [[string, Run][], Run] {
  // We'll need a unique name generator for all variables.
  let count = 0;
  function gensym() {
    let n = count++;
    let result = '';
    do {
      result = (n % 26 + 10).toString(36) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0)
    return result;
  }

  // Seed the references map with the arguments.

  // This shouldn't be a map. it should be string[], where the index is the
  // number.
  let refNames = ["this"];
  for (let i = 0; i < maxArg; ++i) {
    refNames.push(gensym());
  }

  // We return all let statements at the top of the block.
  let topLets : [string, Run][] = [];

  function recurse(refs : string[], val : Fan) : Run {
    whnf(val);

    if (val.t == Kind.NAT && Number(val.v) < refs.length) {
      return {t: RunKind.REF, r: refs[Number(val.v)]};
    }

    if (val.t == Kind.APP) {
      whnf(val.f);

      if (val.f.t == Kind.NAT) {
        // If the toplevel `val` is `(2 x)`:
        if (val.f.v == 2n) {
          return {t: RunKind.CNS, c: val.x };
        }
      } else if (val.f.t == Kind.APP) {
        if (val.f.f.t == Kind.NAT) {
          // If the toplevel `val` is `(0 f x)`:
          if (val.f.f.v == 0n) {
            return {t: RunKind.KAL,
                    f: recurse(refs, val.f.x),
                    x: recurse(refs, val.x)};
          }
          // If the toplevel `val` is `(1 v b)`:
          if (val.f.f.v == 1n) {
            let name = gensym();
            let pushedRefs = [...refs, name];

            let vRun = recurse(pushedRefs, val.f.x);
            topLets.push([name, vRun]);

            return recurse(pushedRefs, val.x);
          }
        }
      }
    }

    return {t: RunKind.CNS, c: val};
  }

  let run = recurse(refNames, val);
  return [topLets, run];
}

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
