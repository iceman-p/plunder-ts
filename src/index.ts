import { Fun, FanKind, DatKind, Nat, Fan, Dat } from "./types"
import * as bigintConversion from 'bigint-conversion'

export function E(val:Fan)          : Fan { return whnf(val);       }
export function F(val:Fan)          : Fan { return force(val);      }
export function A(fun:Fan, arg:Fan) : Fan { return mkApp(fun, arg); }
export function N(nat:Nat)          : Fan { return mkNat(nat);      }

// -----------------------------------------------------------------------

// Dat implementation

function datArity(dat:Dat) : Nat {
  switch (dat.t) {
    case DatKind.PIN:
      return rawArity(dat.i);
    case DatKind.ROW:
      return 1n;
    case DatKind.COW:
      return dat.z;
  }
}

function datEval(dat:Dat, args:Fan[]) : Fan {
  switch (dat.t) {
    case DatKind.PIN:
      let params = args.reverse();
      return callFun(dat.x, dat.i, params);
    case DatKind.ROW:
      return { t: FanKind.DAT, d:{ t:DatKind.COW, z:BigInt(args.length) } };
    case DatKind.COW:
      return { t: FanKind.DAT, d:{ t:DatKind.ROW, r:args.reverse() } };
  }
}

function rebuildPinBody(args:bigint, i:Fan) : Fan {
  if (args == 0n) {
    return A(N(2n), i);
  } else {
    return A(A(N(0n), rebuildPinBody(args - 1n, i)), N(args));
  }
}

function datWut(dat:Dat,
                mkRul:((name:bigint, arity:bigint, body:Fan) => Fan),
                mkCel:((head:Fan, tail:Fan) => Fan)) : Fan {
  switch (dat.t) {
    case DatKind.PIN:
      // PIN p -> rul (LN 0) args (pinBody args $ pinItem p)
      //            where args = (trueArity $ pinItem p)
      let args = trueArity(dat.i);
      return mkRul(0n, args, rebuildPinBody(args, dat.i));
    case DatKind.COW:
      return mkRul(0n, dat.z + 1n, N(0n));
    case DatKind.ROW:
      // TODO: In what order do arguments get stored?
      throw "todo: datWut row"
  }
}

// -----------------------------------------------------------------------

function callFun(f:Fun, _this:Fan, args:Fan[]) : Fan {
  return E(f.apply(_this, args as any) as Fan);
}

/*
  Given (f, [x]) where (f ... x) is known to be saturated:

  Collect all the arguments and execute `f`.
*/
function subst(fun:Fan, args:Fan[]) : Fan {
  while (fun.t == FanKind.APP) {
    args.push(fun.x);
    fun = fun.f;
  }

  if (fun.t == FanKind.FUN) {
    let params = args.reverse();
    let ret = callFun(fun.x, fun, params);
    return ret;
  }

  if (fun.t == FanKind.DAT) {
    return datEval(fun.d, args);
  }

  if (fun.t == FanKind.NAT) {
    switch(fun.v) {
      case 0n: {
        let n = args[2];
        let a = args[1];
        let b = args[0];
        return mkFun(valNat(n), valNat(a), force(args[0]))
      }
      case 1n: {
        let f = args[3];
        let a = args[2];
        let n = args[1];
        let x = args[0];

        E(x);
        switch (x.t) {
          case FanKind.FUN:
            return E(A(A(A(f, N(x.n)), N(x.a)), x.b));
          case FanKind.APP:
            return E(A(A(a, x.f), x.x));
          case FanKind.NAT:
            return E(A(n, x));
          case FanKind.DAT:
            return E(datWut(
              x.d,
              function goLaw(nm, ar, bd) {
                return E(A(A(A(f, N(nm)), N(ar)), bd));
              },
              function goApp(g : Fan, y : Fan) : Fan { return A(A(a, g), y); }
            ));
          case FanKind.THUNK:
            throw "Impossible to have a thunk here.";
        }
      }
      case 2n: {
        let z = args[2];
        let p = args[1];
        let x = args[0];
        let xn = valNat(x)
        if (xn == 0n) {
          return E(z);
        } else {
          let res = A(p, N(xn - 1n));
          return E(res);
        }
      }
      case 3n:
        return N(valNat(args[0]) + 1n);

      default:
        return N(0n);
    }
  }

  throw 'impossible'; // THUNK or APP
  return N(0n);
}

export function trueArity(x:Fan) : Nat {
  if (x.t == FanKind.DAT && x.d.t == DatKind.COW) {
    return x.d.z + 1n;
  }

  return rawArity(x);
}

/*
  Gets the arity of a value without evaluating it.  Returns 0 if given
  a thunk.
*/
export function rawArity(x:Fan) : Nat {
  var depth = 0n;
  while (true) {
    if (x.t == FanKind.APP) {
      let head = x.f;
      x = head;
      depth++;
      continue;
    }
    if (x.t == FanKind.DAT) {
      return datArity(x.d) - depth;
    }
    if (x.t == FanKind.NAT) {
      switch (x.v) {
        case 0n: return (3n - depth);
        case 1n: return (4n - depth);
        case 2n: return (3n - depth);
        default: return (1n - depth);
      }
    }
    if (x.t == FanKind.FUN) {
      return (x.a - depth);
    }
    return 0n;
  };
}

/*
  Maybe this should take multiple arguments?

  Then, for example, if we are being given 4 arguments, and the first
  argument has arity 3, then we can straight-up create a thunk that
  directly calls the function, no need to do the whole `subst` dance
  at all.
*/
export function mkApp(f:Fan, x:Fan) : Fan {
  if (f.t == FanKind.THUNK) {
    return mkThunk(function() {
      let res = mkApp(E(f),x);
      if (res.t == FanKind.THUNK) { res.x(); }
      return res;
    });
  }

  if (rawArity(f) == 1n) {
    return mkThunk(function() {
      let result = subst(f,[x]);
      return result;
    });
  }

  return { t:FanKind.APP, f:f, x:x };
}

export function mkNat(v:Nat) : Fan { return { t:FanKind.NAT, v:v } }

export function mkThunk(exe : (() => Fan)) : Fan {
  let t = { t: FanKind.THUNK, x: function () {} }

  t.x = function () {
    let v = exe();
    let th = (t as any);  // Now that lazy evaluation is actually
    // happening, the `x` field was being left on
    // the result.
    delete th.x;
    Object.assign(t, v);
  }

  return (t as Fan);
}

// Check to ensure a Fan is forced. This is not the "public" force() function
// that does full forcing, but a thing used to force the current top layer.
export function whnf(f : Fan) : Fan {
  while (f.t == FanKind.THUNK) {
    f.x();
  }
  return f;
}

// -----------------------------------------------------------------------

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

// Version 1 of trying to write this failed. Not burning more time on it, this
// just does the silly recursive thing instead.
export function AP(f:Fan, ...xs:Fan[]) : Fan {
  if (xs.length == 0) {
    return f;
  } else if (xs.length == 1) {
    return mkApp(f, xs[0]);
  } else {
    return AP(mkApp(f, xs[0]), ...xs.slice(1));
  }
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

    if (val.t == FanKind.NAT && Number(val.v) < refs.length) {
      return {t: RunKind.REF, r: refs[Number(val.v)]};
    }

    if (val.t == FanKind.APP) {
      whnf(val.f);

      if (val.f.t == FanKind.NAT) {
        // If the toplevel `val` is `(2 x)`:
        if (val.f.v == 2n) {
          return {t: RunKind.CNS, c: val.x };
        }
      } else if (val.f.t == FanKind.APP) {
        if (val.f.f.t == FanKind.NAT) {
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
      // Only start trying to inline nat constants once raw nats are supported
      // in Fan.
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
//  args.reverse(); // Arguments are passed in in reverse order.
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

  // console.log(f.join(''));

  let builder = new Function("AP", "constants", f.join('')) as any;
  // TODO: Actually figuring out the type here is wack, and I bet you can't do
  // it without dependent types on `argc`?
  return builder(AP, constants);
}

let reservedWords = new Set<string>([
  "abstract", "arguments", "await", "boolean", "break", "byte", "case",
  "catch", "char", "class", "const", "continue", "debugger", "default",
  "delete", "do", "double", "else", "enum", "eval", "export", "extends",
  "false", "final", "finally", "float", "for", "function", "goto", "if",
  "implements", "import", "in", "instanceof", "int", "interface", "let",
  "long", "native", "new", "null", "package", "private", "protected",
  "public", "return", "short", "static", "super", "switch", "synchronized",
  "this", "throw", "throws", "transient", "true", "try", "typeof", "var",
  "void", "volatile", "while", "with", "yield"]);

// Create a valid javascripty name for the function. This is either the law
// name if printable, or just "_nameAsNumber".
export function buildName(name : bigint) : string {
  let strName = "";
  try {
    let converted = bigintConversion.bigintToText(name);
    converted = converted.split("").reverse().join("");
    if (/^[A-Za-z0-9]+$/.test(converted)) {
      strName = converted;
    }
  } catch {
    strName = "";
  }

  if (strName == "") {
    strName = "_" + name.toString();
  }

  // If the name is a javascript reserved word, prefix it with a "_".
  if (reservedWords.has(strName)) {
    strName = "_" + strName;
  }

  return strName;
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

  let strName = buildName(name);
  return optToFunction(strName, argc, topOptLet, optBody);
}

function isNatEq(f : Fan, i : bigint) {
  return f.t == FanKind.NAT && f.v == i;
}

function matchPinFromFan(n:bigint, a:{ f:Fan, x:Fan } )
: { t: FanKind.DAT; d: { t:DatKind.PIN; i:Fan; x:(f : Fan[]) => Fan }} | null
{
  while (true) {
    // matchPin 0 (APP (NAT 2) x)                             = Just x
    if (n == 0n) {
      if (isNatEq(a.f, 2n)) {
        if (a.x.t == FanKind.FUN) {
          return { t:FanKind.DAT, d:{ t:DatKind.PIN, i:a.x, x:a.x.x } };
        } else {
          return { t:FanKind.DAT,
                   d:{ t:DatKind.PIN, i:a.x,
                       x: ((f:Fan[]) => { return AP(a.x, ...f); })
                     } };
        }
      } else {
        return null;
      }
    }

    //            a    a.f  a.f.f   a.f.x      a.x
    // matchPin n (APP (APP (NAT 0) (PLN _ x)) (AT m)) | n==m = matchPin (n-1) x
    if (isNatEq(a.x, n) && // n==m
        a.f.t == FanKind.APP &&
        isNatEq(a.f.f, 0n) &&
        a.f.x.t == FanKind.APP) {
      n = n - 1n;
      a = a.f.x;
      continue;
    }

    return null;
  }
}

// When this is a well known jet body, return the jet function that overrides
// the normal execution.
function matchJetPin(body : Fan) : Fun | null
{
  if (body.t != FanKind.FUN) {
    return null;
  }

  let bodyName = bigintConversion.bigintToText(body.n)
    .split("").reverse().join("");

  if (bodyName == "dec") {
    return function dec(a : Fan) {
      console.log("dec jet");
      let n = valNat(a);
      if (n == 0n) {
        return N(0n);
      } else {
        return N(n - 1n);
      }
    }
  } else if (bodyName == "add") {
    return function add(a : Fan, b : Fan) {
      console.log("jetted add");
      return N(valNat(a) + valNat(b));
    }
  }

  return null;
}

export function mkFun(name : bigint, args : bigint, body : Fan) : Fan {
  // Step 1: Try to jet match
  if (name == 0n) {
    if (isNatEq(body, 0n)) {
      if (args == 1n) {
        return { t:FanKind.DAT, d:{ t:DatKind.ROW, r:new Array<Fan>() } };
      } else {
        return { t:FanKind.DAT, d:{ t:DatKind.COW, z:(args - 1n) } };
      }
    } else if (body.t == FanKind.APP) {
      let m = matchPinFromFan(args, body);
      if (m !== null) {
        let jetFun = matchJetPin(m.d.i);
        if (jetFun !== null) {
          m.d.x = jetFun;
        }

        return m;
      }
    }
  }

  // Fallback to compiling the body of the law.
  let fun = compile(name, args, body);
  if (args == 0n) {
    let execu = () => { throw "Infinite Loop"; }
    let thunk = {t: FanKind.THUNK, x:execu} as Fan
    return fun([thunk]);
  } else {
    return {t: FanKind.FUN, n:name, a:args, b: body, x: fun};
  }
}

// -----------------------------------------------------------------------

export function force(val : Fan) : Fan {
  whnf(val);

  if (val.t == FanKind.APP) {
    force(val.f);
    force(val.x);
  }
  return val;
}

function valNat(val : Fan) : Nat {
  whnf(val);

  if (val.t == FanKind.NAT) {
    return val.v;
  } else {
    return 0n;
  }
}

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
