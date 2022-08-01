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

export function mkApp(f:Fan, x:Fan) : Fan {
    return mkThunk(function () { return { t:Kind.APP, f:f, x:x }})
}

export function mkNat(v:Nat) : Fan { return { t:Kind.NAT, v:v } }

export function mkThunk(val : (() => Fan)) : Fan {
    let t : Fan = { t: Kind.THUNK, x: function () {} }
    t.x = function () {
        let v = val()
        Object.assign(t, v);
    }
    return t;
}

// Non-exported check to ensure a Fan is forced. This is not the "public"
// force() function that does full forcing, but a thing used to force the
// current top layer.
function whnf(f : Fan) {
    if (f.t == Kind.THUNK) {
        f.x();
    }
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

/*
export function mkFun(name : bigint, arity : bigint, body : Fan) {
}
*/

// -----------------------------------------------------------------------

function arity(val : Fan) : Nat {
    whnf(val);

    switch (val.t) {
        case Kind.APP:
            return arity(val.f) - 1n;
        case Kind.NAT:
            switch (val.v) {
                case 0n: return 3n;
                case 1n: return 4n;
                case 2n: return 3n;
                default: return 1n;
            }
        case Kind.FUN:
            return val.a;
        case Kind.THUNK:
            throw "Impossible: arity didn't preevaluate thunk";
    }
}

function force(val : Fan) : Fan {
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

// -----------------------------------------------------------------------

function pluneval(n : Fan, args : Fan[]) : Fan {
    if (n.t == Kind.THUNK) {
        n.x()
    }

    if (n.t == Kind.APP) {
        return pluneval(n.f, [n.x].concat(args));
    } else if (n.t == Kind.NAT) {
        let v = n.v;

        if (v == 0n && args.length == 3) {
            //return mkFun(n.n, n.a, n.b);
            throw "mkfun"
        } else if (v == 1n && args.length == 4) {
            /*
            let f, a, n, x;
            [f, a, n, x] = args;
            let arity = x.arity;
            let nod = force(x.nod);

            if (nod.kind == NodKind.APP) {
                return push(push(a, { arity: arity + 1, nod: nod.head }),
                            nod.tail);
            } else if (nod.kind == NodKind.NAT) {
                return push(n, x);
            } else {
                throw "rest of cases in wut";
                }
            */
            throw "unimplemented during porting"
        } else if (v == 2n && args.length == 3) {
            let z, p, x;
            [z, p, x] = args;
            let n = valNat(x);
            if (n == 0n) {
                return z;
            } else {
                return push(p, mkNat(n - 1n));
            }
        } else if (v == 3n && args.length == 1) {
            return mkNat(valNat(args[0]) + 1n);
        } else {
            return mkNat(0n);
        }
    } else {
        throw 'Unimplemented in pluneval';
    }
}


// Entry point.
//
// (%%) :: Fan -> Fan -> Fan
export function push(head : Fan, tail : Fan) : Fan {
    if (arity(head) == 1n) {
        return pluneval(head, [tail])
    } else {
        return mkApp(head, tail);
    }
}

