import { Kind, Nat, Fan } from "./types"
import * as p from '../src/index';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// The compiler composes a bunch of intermediate forms.
//
// - Fan -> Run: Run is a fairly raw translation from the FAN tree.
//
// - Run -> Opt: Opt is a more rich form which pattern matches saturated
//               functions.


export enum RunKind {
  LOG,
  CNS,
  REF,
  KAL
}

// Intermediate form for the compiler.
//
export type Run =
  | { t: RunKind.LOG, l: string, r: Run }
  | { t: RunKind.CNS, c: Fan }
  | { t: RunKind.REF, r: string }
  | { t: RunKind.KAL, f: Run, x: Run }

// Collect all let statements in a function and hoist them to the top.
export type TopRunLet = [string, Run];

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

// Build a new stateful funcion that returns the next in the series of ['a',
// 'b', ..., 'z', 'aa', 'ab', ...]
function mkGensym() : (() => string) {
  let count = 0;
  return function gensym() {
    let n = count++;
    let result = '';
    do {
      result = (n % 26 + 10).toString(36) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0)
    return result;
  }
}

export function fanToRun(argc : number,
                         val : Fan) : [TopRunLet[], Run] {
  // We'll need a unique name generator for all variables.
  let gensym = mkGensym();

  // Seed the references map with the arguments.
  let refNames = ["this"];
  for (let i = 0; i < argc; ++i) {
    refNames.push(gensym());
  }

  // We return all let statements at the top of the block.
  let topLets : TopRunLet[] = [];

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

export enum OptKind {
  LOG,
  CNS,
  REF,
  KAL
}

// Intermediate form for the compiler.
//
export type Opt =
  | { t: OptKind.LOG, l: string, r: Opt }
  | { t: OptKind.CNS, c: Fan }
  | { t: OptKind.REF, r: string }
  | { t: OptKind.KAL, f: Opt[] }

// Collect all let statements in a function and hoist them to the top.
export type TopOptLet = [string, Opt];

// Takes the raw Run
function optimize(r : Run) : Opt {
  switch (r.t) {
    case RunKind.LOG:
      return { t: OptKind.LOG, l: r.l, r: optimize(r.r) }
    case RunKind.CNS:
      return { t: OptKind.CNS, c: r.c };
    case RunKind.REF:
      return { t: OptKind.REF, r: r.r };
    case RunKind.KAL:
      let stack = [optimize(r.x)];
      let next = r.f;
      while (next.t == RunKind.KAL) {
        stack.push(optimize(next.x));
        next = next.f;
      }
      stack.push(optimize(next));
      return { t: OptKind.KAL, f:stack.reverse() }
  }
}

//
function runToFunctionText(constants : Fan[],
                           opt : Opt) : string {
  switch (opt.t) {
    case OptKind.LOG:
      let escaped = JSON.stringify(opt.l);
      return "(function(){console.log(" + escaped + ");\n" +
        runToFunctionText(constants, opt.r) +
        "})()";
    case OptKind.CNS:
      let idx = constants.length
      constants.push(opt.c);
      return "constants[" + idx + "]";
    case OptKind.REF:
      return opt.r;
    case OptKind.KAL:
      let f : string[] = ["AP("];
      let strs = opt.f.map(function (x) {
        return runToFunctionText(constants, x);
      });
      f.push(strs.join());
      f.push(")");
      return f.join('');
  }
}

// Returns a function meant to be called with `apply(this, args)`.
export function optToFunction(name : string,
                              argc : number,
                              lets : TopOptLet[],
                              run : Opt) {
  let gensym = mkGensym();

  // Constant values need to be passed into the function instead of being in
  // the text because they might be thunks and their evaluation should cause
  // them to be evaluated outside of this function. They could also be very
  // large values and textifying them could be very expensive.
  let constants : Fan[] = [];

  // We produce the inner text of a function which given the environment,
  // returns a named function which uses our apply() based calling
  // convention. We set the name if appropriate so it shows up in devtools.
  let f : string[] = ["return function " + name + "("];
  let args = []
  for (let i = 0; i < argc; ++i) {
    args.push(gensym());
  }
  f.push(args.join());
  f.push(") {\n");

  for (let [letName, letVal] of lets) {
    f.push("const " + letName + " = ");
    f.push(runToFunctionText(constants, letVal));
    f.push(";\n");
  }

  f.push("return ");
  f.push(runToFunctionText(constants, run));
  f.push(";\n");

  f.push("}");

  let builder = new Function("AP", "constants", f.join('')) as any;
  // TODO: Actually figuring out the type here is wack, and I bet you can't do
  // it without dependent types on `argc`?
  return builder(p.AP, constants);
}

export function compile(name : bigint, args : bigint, fanBody : Fan)
{
  let argc = Number(args);
  let [toprunlet, runBody] = fanToRun(argc, fanBody);

  let optBody = optimize(runBody);
  let topOptLet = toprunlet.map(
    function (a : TopRunLet) : TopOptLet {
      let [name, run] = a;
      return [name, optimize(run)] });

  // TODO: Wrong name for now, process based off name.
  return optToFunction("BIG", argc, topOptLet, optBody);
}


// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
