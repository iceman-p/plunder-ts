import { FanFun, Fun, FanKind, Nat, Fan } from "./types"
import * as bigintConversion from 'bigint-conversion'

export function E(val:Fan)          : Fan { return whnf(val);       }
export function F(val:Fan)          : Fan { return force(val);      }
export function A(fun:Fan, arg:Fan) : Fan { return mkApp(fun, arg); }

// -----------------------------------------------------------------------

function rebuildPinBody(args:bigint, i:Fan) : Fan {
  if (args == 0n) {
    return A(2n, i);
  } else {
    return A(A(0n, rebuildPinBody(args - 1n, i)), args);
  }
}

function rowWut(r : Fan[],
                mkRul:((name:bigint, arity:bigint, body:Fan) => Fan),
                mkCel:((head:Fan, tail:Fan) => Fan)) : Fan {
  let sz = r.length;
  if (sz == 0) {
    return mkRul(0n, 1n, 0n);
  }

  let rev = r.slice().reverse();
  if (rev.length == 0) {
    throw "implement datWut row 0 case"
  } else if (rev.length == 1) {
    return mkCel(mkCow(sz), rev[0]);
  } else {
    // Multiple items in list.
    let ret = mkCow(sz);
    for (let x of rev.slice(0, -1)) {
      ret = A(ret, x);
    }
    return mkCel(ret, rev.slice(-1)[0]);
  }
}

export function mkCow(sz : number) : Fan {
  return { t: FanKind.COW, z:BigInt(sz) };
}

function isApp(a : Fan)
  : a is { t: FanKind.APP, f:Fan, x:Fan }
{
  return typeof a !== "bigint" && !Array.isArray(a) && a.t == FanKind.APP;
}

function isFun(a : Fan)
  : a is { t: FanKind.FUN, n:Nat, a:Nat, b:Fan, x:Fun }
{
  return typeof a !== "bigint" && !Array.isArray(a) && a.t == FanKind.FUN;
}

function isThunk(a : Fan)
  : a is { t: FanKind.THUNK, x:((() => void) | null), r:(Fan | null) }
{
  return typeof a !== "bigint" && !Array.isArray(a) && a.t == FanKind.THUNK;
}

function isPin(a : Fan)
  : a is { t: FanKind.PIN, i:Fan, x:Fun }
{
  return typeof a !== "bigint" && !Array.isArray(a) && a.t == FanKind.PIN;
}

function isRow(a : Fan)
  : a is Fan[]
{
  return typeof a !== "bigint" && Array.isArray(a);
}

function isCow(a : Fan)
  : a is { t: FanKind.COW, z:Nat }
{
  return typeof a !== "bigint" && !Array.isArray(a) && a.t == FanKind.COW;
}

function isNat(a : Fan)
  : a is Nat
{
  return typeof a === "bigint"
}

// -----------------------------------------------------------------------

function callFun(f:Fun, _this:Fan, args:Fan[]) : Fan {
  return E(f.apply(_this, args as any) as Fan);
}

/*
  Given (f, [x]) where (f ... x) is known to be saturated:

  Collect all the arguments and execute the head against them.
*/
function subst(fun:Fan, args:Fan[]) : Fan {
  while (isThunk(fun)) {
    if (fun.r !== null) {
      fun = fun.r;
    } else {
      throw "impossible to subst an unexec thunk";
    }
  }

  while (isApp(fun)) {
    args.push(fun.x);
    fun = fun.f;
  }

  let self : Fan = fun;
  while (isPin(self)) { self = self.i; }

  // TODO Have laws know themselves in order to eliminate .apply(self...
  return valFun(fun).apply(self, args);
}

function prim_mkfun(b:Fan, a:Fan, n:Fan) : Fan {
  return mkFun(valNat(n), valNat(a), force(b));
}

function prim_wut(x:Fan, n:Fan, a:Fan, f:Fan) : Fan {
  x = E(x);
  if (isNat(x)) {
    return E(A(n, x));
  } else if (isRow(x)) {
    // TODO: beautify this and change the function type.
    return E(rowWut(
      x,
      function goLaw(nm, ar, bd) {
        return E(A(A(A(f, nm), ar), bd));
      },
      function goApp(g : Fan, y : Fan) : Fan {
        return E(A(A(a, g), y));
      }));
  } else {
    switch (x.t) {
      case FanKind.FUN:
        return E(A(A(A(f, x.n), x.a), x.b));
      case FanKind.APP:
        return E(A(A(a, x.f), x.x));
      case FanKind.PIN:
        // PIN p -> rul (LN 0) args (pinBody args $ pinItem p)
        //            where args = (trueArity $ pinItem p)
        let args = trueArity(x.i);
        return E(A(A(A(f, 0n), args), rebuildPinBody(args, x.i)));
      case FanKind.COW:
        return E(A(A(A(f, 0n), x.z + 1n), 0n));
      case FanKind.THUNK:
        throw "Impossible to have a thunk here.";
    }
  }
}

function prim_natcase(x:Fan, p:Fan, z:Fan) : Fan {
  let xn = valNat(x)
  if (xn == 0n) {
    return E(z);
  } else {
    let res = A(p, xn - 1n);
    return E(res);
  }
}

function prim_increment(x:Fan) : Fan {
  return valNat(x) + 1n;
}

function prim_fallback(x:Fan) : Fan {
  return 0n;
}

function natFun (nat : Nat) : Fun {
  switch (nat) {
  case 0n:
    return prim_mkfun;
  case 1n:
    return prim_wut;
  case 2n:
    return prim_natcase;
  case 3n:
    return prim_increment;
  default:
    return prim_fallback;
  }
}

function valFun(val:Fan) : Fun {
  if (isThunk(val)) {
    throw "valFun expects a normalized input";
  }

  if (isApp(val)) {
    throw "valFun expects something besides an APP.";
  }

  if (isNat(val)) {
    return natFun(val);
  }

  if (isRow(val)) {
    let sz = BigInt(val.length);
    return function(x:Fan) : Fan {
      return { t: FanKind.COW, z:sz };
    }
  }

  switch (val.t) {
    case FanKind.FUN: return val.x;
    case FanKind.PIN: return val.x;
    case FanKind.COW: return function cow (...r: Fan[]): Fan { return r; }
  }

  throw 'impossible';
  return 0n;
}

export function trueArity(x:Fan) : Nat {
  if (isCow(x)) {
    return x.z + 1n;
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
    if (isNat(x)) {
      switch (x) {
        case 0n: return (3n - depth);
        case 1n: return (4n - depth);
        case 2n: return (3n - depth);
        default: return (1n - depth);
      }
    }
    if (isRow(x)) {
      return 1n - depth;
    }
    switch (x.t) {
      case FanKind.APP: {
        let head = x.f;
        x = head;
        depth++;
        continue;
      }
      case FanKind.FUN: {
        return (x.a - depth);
      }
      case FanKind.PIN: {
        // TODO: Write this iteratively.
        return rawArity(x.i) - depth;
      }
      case FanKind.COW: {
        return x.z - depth;
      }
    }

    if (x.t == FanKind.THUNK && x.r !== null) {
      x = x.r;
      continue;
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
  if (isThunk(f)) {
    return mkThunk(function() {
      let res = mkApp(E(f),x);
      if (isThunk(res) && res.x !== null) {
        res.x();
        res.x = null;
        return res.r as Fan;
      } else {
        return res;
      }
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

function mkThunk(exe : (() => Fan)) : Fan {
  let t : any = { t: FanKind.THUNK, x: null, r:null }

  t.x = function () {
    if (t.r === null) {
      let th = (t as any);
      th.r = exe();
      th.x = null;
    } else {
      throw "Attempted to double call a thunk";
    }
  }

  return (t as Fan);
}

// Returns the current value, or if an unexecuted thunk, executes it and
// returns the one step forced value.
export function whnf(f : Fan) : Fan {
  while (isThunk(f)) {
    if (f.x !== null) {
      f.x();
      f.x = null;
      f = f.r as unknown as Fan;
    } else if (f.r !== null) {
      f = f.r;
    } else {
      throw "Impossible thunk"
    }
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
  }

  let ra = rawArity(f);
  if (ra != 0n && ra == BigInt(xs.length)) {
    return mkThunk(function() {
      let result = subst(f,xs.reverse());
      return result;
    });
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
  let refNames = ["self"];
  for (let i = 0; i < argc; ++i) {
    refNames.push(gensym());
  }

  // We return all let statements at the top of the block.
  let topLets : TopRunLet[] = [];

  function recurse(refs : string[], val : Fan) : Run {
    val = whnf(val);

    if (isNat(val) && Number(val) < refs.length) {
      return {t: RunKind.REF, r: refs[Number(val)]};
    }

    if (isApp(val)) {
      val.f = whnf(val.f);

      if (isNat(val.f)) {
        // If the toplevel `val` is `(2 x)`:
        if (val.f == 2n) {
          return {t: RunKind.CNS, c: val.x };
        }
      } else if (isRow(val)) {
        // do nothing, it's a constant but we have to have an if here for type
        // reasons.
      } else if (isApp(val.f)) {
        if (isNat(val.f.f)) {
          // If the toplevel `val` is `(0 f x)`:
          if (val.f.f == 0n) {
            return {t: RunKind.KAL,
                    f: recurse(refs, val.f.x),
                    x: recurse(refs, val.x)};
          }
          // If the toplevel `val` is `(1 v b)`:
          if (val.f.f == 1n) {
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
  KAL,
  EXE,
  IF,
}

// Intermediate form for the compiler.
//
export type Opt =
  | { t: OptKind.LOG, l: string, r: Opt }
  | { t: OptKind.CNS, c: Fan }
  | { t: OptKind.REF, r: string }
  | { t: OptKind.KAL, f: Opt[] }
  | { t: OptKind.IF, raw:Opt, i:Opt, th:Opt, el:Opt }
  | { t: OptKind.EXE, x: Fun, f: Fan, rs: Opt[] }

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
      let call = stack.reverse();
      let head = call[0];

      if (head.t != OptKind.CNS) {
        return { t: OptKind.KAL, f:call }
      }

      let headFan : Fan = head.c;

      // TODO We can also handle cases where the arity is less than the
      // number of arguments by outputing an inner EXE and an outer KAL.
      if (BigInt(call.length) != (1n + rawArity(headFan))) {
        return { t: OptKind.KAL, f:call }
      }

      // Here we are dealing with a saturated call to a constant function.

      // TODO Gross
      if (isApp(headFan)) {
          call.reverse();
          call.pop();
          while (isApp(headFan)) {
            call.push({t:OptKind.CNS, c:headFan.x});
            headFan = headFan.f;
          }
          head = {t:OptKind.CNS, c:headFan};
          call.push(head);
          call.reverse();
      }

      if (isPin(head.c) && isFun(head.c.i)) {
        switch (buildName(head.c.i.n)) {
        case "_if":
          // console.log("_if");
          return { t: OptKind.IF,
                   raw: { t: OptKind.KAL, f:call },
                   i:call[1], th:call[2], el:call[3] };
        case "ifNot":
          // console.log("ifNot");
          return { t: OptKind.IF,
                   raw: { t: OptKind.KAL, f:call },
                   i:call[1], th:call[3], el:call[2] };
        default:
          break;
        }
      }

      // return { t: OptKind.KAL, f:call }

      let args : Opt[] = [];
      for (let i=1; i<call.length; i++) { args.push(call[i]); }
      // console.log("EXE", valFun(headFan), args)
      // console.log(valFun(headFan));

      // TODO Eliminate `f` and have laws know themselves instead.
      let funSelf : Fan = headFan;
      while (isPin(funSelf)) {
        funSelf = funSelf.i;
      }

      return { t: OptKind.EXE, x:valFun(headFan), f:funSelf, rs:args }
  }
}

enum Position {
  INNER,
  STMT
}

//
function runToFunctionText(strs : string[],
                           pos : Position,
                           constants : Fan[],
                           opt : Opt) {
  let pushConst = (x: Fan) => {
    let idx = constants.length;
    constants.push(x);
    strs.push("$[");
    strs.push(idx.toString());
    strs.push("]");
    return idx;
  }

  switch (opt.t) {
    case OptKind.LOG:
      if (pos == Position.STMT) {
        strs.push("return ");
      }
      strs.push("(function(){console.log(");
      strs.push(JSON.stringify(opt.l));
      strs.push(");\n");
      runToFunctionText(strs, Position.INNER, constants, opt.r);
      strs.push("})()");
      if (pos == Position.STMT) {
        strs.push(";\n");
      }
      return;
    case OptKind.CNS:
      // TODO: Only start trying to inline nat constants once raw nats are
      // supported in Fan.
      if (pos == Position.STMT) {
        strs.push("return ");
      }
      pushConst(opt.c)
      if (pos == Position.STMT) {
        strs.push(";\n");
      }
      return;
    case OptKind.REF:
      if (pos == Position.STMT) {
        strs.push("return ");
      }
      strs.push(opt.r);
      if (pos == Position.STMT) {
        strs.push(";\n");
      }
      return;

    // { t: OptKind.EXE, x: Fun, f: Fan, rs: Opt[] }
    case OptKind.EXE: {
      if (pos == Position.INNER) {
        strs.push("TH(() => ");
        let x_idx = pushConst(opt.x);
        strs.push("(");
        for (let i=(opt.rs.length-1); i>-1; i--) {
          let r = opt.rs[i];
          runToFunctionText(strs, Position.INNER, constants, r);
          if (i>0) strs.push(", ");
        }
        strs.push("))");
        return;
      }

      strs.push("return ");
      let x_idx = pushConst(opt.x);
      strs.push("(");
      for (let i=(opt.rs.length-1); i>-1; i--) {
        let r = opt.rs[i];
        runToFunctionText(strs, Position.INNER, constants, r);
        if (i>0) strs.push(", ");
      }
      strs.push(");");
      return;
    }

    case OptKind.KAL: {
      if (pos == Position.STMT) {
        strs.push("return ");
      }
      strs.push("AP(");
      let first = true;
      for (let xf of opt.f) {
        if (!first) strs.push(",");
        runToFunctionText(strs, Position.INNER, constants, xf);
        first = false;
      }
      strs.push(")");
      if (pos == Position.STMT) {
        strs.push(";\n");
      }
      return;
    }
    case OptKind.IF: {
      if (pos == Position.STMT) {
        strs.push("if (valNat(");
        runToFunctionText(strs, Position.INNER, constants, opt.i);
        strs.push(") != 0n) {\n");
        runToFunctionText(strs, Position.STMT, constants, opt.th);
        strs.push("} else {\n");
        runToFunctionText(strs, Position.STMT, constants, opt.el);
        strs.push("}\n");
      } else {
        runToFunctionText(strs, Position.INNER, constants, opt.raw);
      }
      return;
    }
  }
}

// Returns a function meant to be called with `apply(this, args)`.
export function optToFunction
    ( name : string
    , argc : number
    , lets : TopOptLet[]
    , run  : Opt
    , self : Fan
    )
{
  let gensym = mkGensym();

  // Constant values need to be passed into the function instead of being in
  // the text because they might be thunks and their evaluation should cause
  // them to be evaluated outside of this function. They could also be very
  // large values and textifying them could be very expensive.
  //
  // (Note from Benjamin: they will never be thunks because the body is
  // forced before creating the function, but they can indeed be huge).
  let constants : Fan[] = [];

  // We produce the inner text of a function which given the environment,
  // returns a named function which uses our apply() based calling
  // convention. We set the name if appropriate so it shows up in devtools.
  let strs : string[] = ["return function " + name + "("];
  let args = []
  for (let i = 0; i < argc; ++i) {
    args.push(gensym());
  }
  strs.push(args.reverse().join());
  strs.push(") {\n");

  for (let [letName, letVal] of lets) {
    strs.push("const " + letName + " = ");
    runToFunctionText(strs, Position.INNER, constants, letVal);
    strs.push(";\n");
  }

  runToFunctionText(strs, Position.STMT, constants, run);

  strs.push("}");

  console.log(strs.join(''));
  // console.log(constants);

  let builder = new Function("AP", "valNat", "TH", "$", "self", strs.join('')) as any;
  // TODO: Actually figuring out the type here is wack, and I bet you can't do
  // it without dependent types on `argc`?
  return builder(AP, valNat, mkThunk, constants, self);
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

export function compile
    ( self : Fan
    , name : bigint
    , args : bigint
    , fanBody : Fan
    )
{
  let argc = Number(args);
  let [toprunlet, runBody] = fanToRun(argc, fanBody);

  let optBody = optimize(runBody);
  let topOptLet = toprunlet.map(
    function (a : TopRunLet) : TopOptLet {
      let [name, run] = a;
      return [name, optimize(run)] });

  let strName = buildName(name);
  return optToFunction(strName, argc, topOptLet, optBody, self);
}

function isNatEq(f : Fan, i : bigint) {
  return isNat(f) && f == i;
}

function matchPinFromFan(n:bigint, a:{ f:Fan, x:Fan } )
  : { t: FanKind.PIN; i:Fan; x:(f : Fan[]) => Fan } | null
{
  while (true) {
    // matchPin 0 (APP (NAT 2) x)                             = Just x
    if (n == 0n) {
      if (isNatEq(a.f, 2n)) {
        if (isFun(a.x)) {
          return { t:FanKind.PIN, i:a.x, x:a.x.x };
        } else {
          return { t:FanKind.PIN, i:a.x,
                   x: ((f:Fan[]) => { return AP(a.x, ...f); }) };
        }
      } else {
        return null;
      }
    }

    //            a    a.f  a.f.f   a.f.x      a.x
    // matchPin n (APP (APP (NAT 0) (PLN _ x)) (AT m)) | n==m = matchPin (n-1) x
    if (isNatEq(a.x, n) && // n==m
        isApp(a.f) &&
        isNatEq(a.f.f, 0n) &&
        isApp(a.f.x)) {
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
  if (!isFun(body)) {
    return null;
  }

  let bodyName = bigintConversion.bigintToText(body.n)
    .split("").reverse().join("");

  if (bodyName == "dec") {
    return function dec(a : Fan) {
      let n = valNat(a);
      if (n == 0n) {
        return 0n;
      } else {
        return n - 1n;
      }
    }
  } else if (bodyName == "add") {
    return function add(b : Fan, a : Fan) {
      return valNat(b) + valNat(a);
    }
  } else if (bodyName == "mul") {
    return function mul(b : Fan, a : Fan) {
      return valNat(b) * valNat(a);
    }
  } else if (bodyName == "sub") {
    return function sub(b : Fan, a : Fan) {
      let x = valNat(a);
      let y = valNat(b);
      if (y > x) {
        return 0n;
      } else {
        return x - y;
      }
    }
  } else if (bodyName == "bex") {
    return function bex(a : Fan) {
      return 2n ** valNat(a);
    }
  } else if (bodyName == "lte") {
    return function lte(b : Fan, a : Fan) {
      if (valNat(a) <= valNat(b)) {
        return 1n;
      } else {
        return 0n;
      }
    }
  } else if (bodyName == "lth") {
    return function lth(b : Fan, a : Fan) {
      if (valNat(a) < valNat(b)) {
        return 1n;
      } else {
        return 0n;
      }
    }
  } else if (bodyName == "div") {
    return function div(b : Fan, a : Fan) {
      let yv = valNat(b);
      if (yv == 0n) {
        return 0n;
      } else {
        return valNat(a) / yv;
      }
    }
  } else if (bodyName == "mod") {
    return function mod(b : Fan, a : Fan) {
      return valNat(a) % valNat(b);
    }
  } else if (bodyName == "aeq") {
    return function aeq(b : Fan, a : Fan) {
      if (valNat(a) == valNat(b)) {
        return 1n;
      } else {
        return 0n;
      }
    }
  } else if (bodyName == "lsh") {
    return function lsh(b : Fan, a : Fan) {
      return valNat(a) << valNat(b);
    }
  } else if (bodyName == "rsh") {
    return function rsh(b : Fan, a : Fan) {
      return valNat(a) >> valNat(b);
    }
  } else if (bodyName == "mix") {
    return function mix(b : Fan, a : Fan) {
      return valNat(a) ^ valNat(b);
    }
  } else if (bodyName == "con") {
    return function con(b : Fan, a : Fan) {
      return valNat(a) | valNat(b);
    }
  } else if (bodyName == "dis") {
    return function dis(b : Fan, a : Fan) {
      return valNat(a) & valNat(b);
    }

  // Row jets
  } else if (bodyName == "isRow") {
    return function _isRow(a : Fan) {
      return isRow(E(a)) ? 1n : 0n;
    }
  } else if (bodyName == "idx") {
    return function idx(this : FanFun, v : Fan, i : Fan ) {
      v = E(v);
      if (isRow(v)) {
        return v[Number(valNat(i))];
      }

      // TODO: Remove callFun in jet impls.
      return callFun(this.x, this, [v, i]);
    }
  } else if (bodyName == "get") {
    return function get(this : FanFun, i : Fan, v : Fan ) {
      v = E(v);
      if (isRow(v)) {
        return v[Number(valNat(i))];
      }

      // TODO: Remove callFun in jet impls.
      return callFun(this.x, this, [i, v]);
    }
  } else if (bodyName == "len") {
    return function drop(this : FanFun, a : Fan) {
      a = E(a);
      if (isRow(a)) {
        return BigInt(a.length);
      }

      return callFun(this.x, this, [a]);
    }
  } else if (bodyName == "weld") {
    return function weld(this : FanFun, b : Fan, a : Fan) {
      a = E(a);
      b = E(b);
      if (isRow(a) && isRow(b)) {
        return [...a, ...b];
      }

      return callFun(this.x, this, [b, a]);
    }
  } else if (bodyName == "map") {
    return function map(this : FanFun, b : Fan, a : Fan) {
      a = E(a);
      b = E(b);
      if (isRow(b)) {
        return b.map(function (x) {
          return E(A(a, x));
        });
      }

      return callFun(this.x, this, [b, a]);
    }
  // TODO: put
  } else if (bodyName == "take") {
    return function take(this : FanFun, b : Fan, a : Fan) {
      a = E(a);
      b = E(b);
      if (isRow(b)) {
        return b.slice(0, Number(valNat(a)));
      }

      return callFun(this.x, this, [b, a]);
    }
  } else if (bodyName == "drop") {
    return function drop(this : FanFun, b : Fan, a : Fan) {
      a = E(a);
      b = E(b);
      if (isRow(b)) {
        return b.slice(Number(valNat(a)));
      }

      return callFun(this.x, this, [b, a]);
    }
  } else if (bodyName == "cat") {
    return function drop(this : FanFun, a : Fan) {
      a = E(a);
      if (isRow(a)) {
        let valid = true;
        let arrays = [];
        for (let x of a) {
          x = E(x);
          if (isRow(x)) {
            arrays.push(x);
          } else {
            valid = false;
            break;
          }
        }

        if (valid) {
          if (arrays.length == 0) {
            return [];
          } else {
            return ([] as Fan[]).concat.apply([], arrays);
          }
        }
      }

      return callFun(this.x, this, [a]);
    }
  } else if (bodyName == "cordFromRow") {
    // TODO: As mentioned in the haskell implementation, you probably don't
    // want to have this jet and should be using a bar now that it exists.
    return function cordFromRow(this : FanFun, a : Fan) {
      a = E(a);
      if (isRow(a)) {
        let nats : Nat[] = [];
        for (let x of a) {
          // Validate that each item is a good number.
          x = whnf(x);
          if (isNat(x) && x > 0n && x < 256n) {
            nats.push(x);
          } else {
            // Fallback.
            return callFun(this.x, this, [a]);
          }
        }

        // This is convoluted and kind of dumb, but it works. It'd be better if
        // there was a more optimized thing to do here.
        function dec2hex(i : bigint) {
          return (i + 0x100n).toString(16).substr(-2).toUpperCase();
        }

        var hexStr = nats.map(dec2hex).join('');
        let b = BigInt('0x' + hexStr)
        let str = bigintConversion.bigintToText(b);
        console.log("str:", str);
        return b;
      }
      return callFun(this.x, this, [a]);
    }
  }

  return null;
}

export function mkFun(name : bigint, args : bigint, body : Fan) : Fan {
  // Step 1: Try to jet match
  if (name == 0n) {
    if (isNatEq(body, 0n)) {
      if (args == 1n) {
        return [];
      } else {
        return { t: FanKind.COW, z:(args - 1n) };
      }
    } else if (isApp(body)) {
      let m = matchPinFromFan(args, body);
      if (m !== null) {
        let jetFun = matchJetPin(m.i);
        if (jetFun !== null) {
          m.x = jetFun;
        }

        return m;
      }
    }
  }

  // Fallback to compiling the body of the law.
  let execu = () => { throw "Infinite Loop"; }
  if (args == 0n) {
    let self = {t: FanKind.THUNK, x:execu, r:null} as Fan
    let fun = compile(self, name, args, body);
    return fun([self]);
  } else {
    let self = {t: FanKind.FUN, n:name, a:args, b: body, x:execu};
    let fun = compile(self as Fan, name, args, body);
    self.x = fun;
    return (self as Fan);
  }
}

// -----------------------------------------------------------------------

export function force(val : Fan) : Fan {
  val = whnf(val);

  if (isApp(val)) {
    if (isThunk(val.f))
      val.f = force(val.f);
    if (isThunk(val.x))
      val.x = force(val.x);
  }
  if (isRow(val)) {
    for (let i in val) {
      if (isThunk(val[i]))
        val[i] = force(val[i]);
    }
  }

  return val;
}

function valNat(val : Fan) : Nat {
  val = whnf(val);

  if (isNat(val)) {
    return val;
  } else {
    return 0n;
  }
}

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
