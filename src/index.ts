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

// -----------------------------------------------------------------------

function arity(val : Fan) : Nat {
    if (val.t == Kind.THUNK) {
        val.x();
    }

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
    if (val.t == Kind.THUNK) {
        val.x();
    }

    if (val.t == Kind.APP) {
        force(val.f);
        force(val.x);
    }
    return val;
}

function valNat(val : Fan) : Nat {
    if (val.t == Kind.THUNK) {
        val.x();
    }

    if (val.t == Kind.NAT) {
        return val.v;
    } else {
        return 0n;
    }
}

// -----------------------------------------------------------------------

/*

// I need subst to build a thunk

function subst(r : bigint, xs : Pln[], b : Pln) {
    let v = force(b.nod);
    if (v.kind == NodKind.NAT && v.nat < r) {
        
    }

    
}

// Build a LAW.
//
// For v1 of this, we're going to follow the super short 
function mkLaw(name : bigint, arg : bigint, bod : Pln) : Pln {
    if (arg == 0n) {
        // We build a thunk for res


        //let x = 
    } else {
        return {
            state: ThunkState.VAL, val: {
                kind: NodKind.LAW,
                name: name,
                args: arg,
                bod: bod }
        }
    }
}

*/

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
            throw "mkLaw unimplemented";
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

