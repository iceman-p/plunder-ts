export enum Kind {
  APP = 1,
  NAT,
  FUN,
  THUNK,
}

export type Nat = bigint;

export type Fan =
  | { t: Kind.APP; f:Fan; x:Fan }
  | { t: Kind.NAT; v:Nat }
  | { t: Kind.FUN; n:Nat; a:Nat; b:Fan; x:(f : Fan[]) => Fan }
  | { t: Kind.THUNK; x:() => void }

function E(val:Fan)          : Fan { return whnf(val);       }
function F(val:Fan)          : Fan { return force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return mkNat(nat);      }

/*
  Given (f, [x]) where (f ... x) is known to be saturated:

  Collect all the arguments and execute `f`.
*/
function subst(fun:Fan, args:Fan[]) : Fan {
  while (fun.t == Kind.APP) {
    args.push(fun.x);
    fun = fun.f;
  }

  if (fun.t == Kind.FUN) {
    let params = [fun as Fan]
    for (let i=0; i<args.length; i++) {
      params.push(args[i]);
    }

    // I think the best calling convention here may be:
    //
    //     fun.x.apply(fun, params);
    //
    // With params still in reverse order.
    //
    //     function die (x) { return A(this, x) }
    //     function K (y, x) { return x; }
    //
    return fun.x(params);
  }

  if (fun.t == Kind.NAT) {
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
          case Kind.FUN:
            return E(A(A(A(f, N(x.n)), N(x.a)), x.b));
          case Kind.APP:
            return E(A(A(a, x.f), x.x));
          case Kind.NAT:
            return E(A(n, x));
          case Kind.THUNK:
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

/*
  Gets the arity of a value without evaluating it.  Returns 0 if given
  a thunk.
*/
export function rawArity(x:Fan) : Nat {
  var depth = 0n;
  while (true) {
    if (x.t == Kind.APP) {
      let head = x.f;
      x = head;
      depth++;
      continue;
    }
    if (x.t == Kind.NAT) {
      switch (x.v) {
        case 0n: return (3n - depth);
        case 1n: return (4n - depth);
        case 2n: return (3n - depth);
        default: return (1n - depth);
      }
    }
    if (x.t == Kind.FUN) {
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
  if (f.t == Kind.THUNK) {
    return mkThunk(function() {
      let res = mkApp(E(f),x);
      if (res.t == Kind.THUNK) { res.x(); }
      return res;
    });
  }

  if (rawArity(f) == 1n) {
    return mkThunk(function() {
      let result = subst(f,[x]);
      return result;
    });
  }

  return { t:Kind.APP, f:f, x:x };
}

export function mkNat(v:Nat) : Fan { return { t:Kind.NAT, v:v } }

export function mkThunk(exe : (() => Fan)) : Fan {
  let t = { t: Kind.THUNK, x: function () {} }

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

// Non-exported check to ensure a Fan is forced. This is not the "public"
// force() function that does full forcing, but a thing used to force the
// current top layer.
function whnf(f : Fan) : Fan {
  if (f.t == Kind.THUNK) {
    f.x();
  }
  if (f.t == Kind.THUNK) {
    throw "NO WHNF AFTER EVAL";
  }
  return f;
}

// -----------------------------------------------------------------------

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
  | { t: RunKind.REF, r: number }
  | { t: RunKind.KAL, f: Run, x: Run }
  | { t: RunKind.LET, i: number, v: Run, f: Run }

export type Prog = { arity: number,
                     stkSz: number,
                     prgm: (args : Fan[]) => Fan }

// Given a raw fan value, build out an intermediate Run structure describing
// the steps to run, plus the maximum stack size that this needs.
//
// internal detail, exported for testing.
export function fanToRun(maxArg : number, val : Fan) : [number, Run] {
  whnf(val);

  if (val.t == Kind.NAT && val.v <= BigInt(maxArg)) {
    return [maxArg, {t: RunKind.REF, r: Number(val.v)}];
  }

  if (val.t == Kind.APP) {
    whnf(val.f);

    if (val.f.t == Kind.NAT) {
      // If the toplevel `val` is `(2 x)`:
      if (val.f.v == 2n) {
        return [maxArg, {t: RunKind.CNS, c: val.x }]
      }
    } else if (val.f.t == Kind.APP) {
      if (val.f.f.t == Kind.NAT) {
        // If the toplevel `val` is `(0 f x)`:
        if (val.f.f.v == 0n) {
          let [fMax, fRun] = fanToRun(maxArg, val.f.x);
          let [xMax, xRun] = fanToRun(maxArg, val.x);
          return [Math.max(fMax, xMax),
                  {t: RunKind.KAL, f:fRun, x:xRun}];
        }
        // If the toplevel `val` is `(1 v b)`:
        if (val.f.f.v == 1n) {
          let [vMax, vRun] = fanToRun(maxArg + 1, val.f.x);
          let [bMax, bRun] = fanToRun(maxArg + 1, val.x);
          return [Math.max(vMax, bMax),
                  { t: RunKind.LET, i: maxArg + 1, v:vRun, f:bRun }];
        }
      }
    }
  }

  return [maxArg, {t: RunKind.CNS, c: val }]
}

// Given the Run structure from `fanToRun`, translate the Run structure into
// autogenerated javascript to pass to the interpreter, which should hopefully
// JIT it for us if we call it enough.
//
export function compileRunToFunction(maxStk : number, r : Run)
: (args : Fan[]) => Fan
{
  let preamble = `
let stk = [...rawargs];
if (` + maxStk + ` > stk.length) {
stk.concat(Array(` + maxStk + ` - rawargs.length));
}
`;

  // Constant values need to be passed into the function instead of being in
  // the text because they might be thunks and their evaluation should cause
  // them to be evaluated outside of this function. They could also be very
  // large values and textifying them could be very expensive.
  let constants : Fan[] = [];

  function walk(r : Run) : string {
    switch (r.t) {
      case RunKind.LOG:
        let escaped = JSON.stringify(r.l);
        return "console.log(" + escaped + ");\n" + walk(r.r);
      case RunKind.CNS:
        let idx = constants.length
        constants.push(r.c);
        return "return constants[" + idx + "];";
      case RunKind.REF:
        return "return stk[" + r.r + "];"
      case RunKind.KAL:
        return "return mkApp((function(){\n" + walk(r.f) +
          "\n})(), (function(){\n" + walk(r.x) + "\n})());";
      case RunKind.LET:
        return "stk[" + r.i + "] = (function(){\n" + walk(r.v) +
          "\n})();\n" +
          walk(r.f);
    }
  }

  // We walk the tree to turn everything into a set of statements.
  let functext = preamble + walk(r);

  let fun = new Function("mkApp", "constants", "rawargs", functext) as
  ((p : (h : Fan, t : Fan) => Fan, consts: Fan[], args: Fan[]) => Fan);

  return function(args: Fan[]) : Fan {
    return fun(mkApp, constants, args);
  }
}

export function mkFun(name : bigint, args : bigint, body : Fan) : Fan {
  let [stkSize, run] = fanToRun(Number(args), body);
  let fun = compileRunToFunction(stkSize, run);
  if (args == 0n) {
    let execu = () => { throw "Infinite Loop"; }
    let thunk = {t: Kind.THUNK, x:execu} as Fan
    return fun([thunk]);
  } else {
    return {t: Kind.FUN, n:name, a:args, b: body, x: fun};
  }
}

// -----------------------------------------------------------------------

export function force(val : Fan) : Fan {
  whnf(val);

  if (val.t == Kind.APP) {
    force(val.f);
    force(val.x);
  }
  return val;
}

function valNat(val : Fan) : Nat {
  whnf(val);

  if (val.t == Kind.NAT) {
    return val.v;
  } else {
    return 0n;
  }
}

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
