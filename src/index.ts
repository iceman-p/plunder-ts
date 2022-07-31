

enum NodKind {
    APP = 1,
    NAT,
}

type Nod =
    | { kind: NodKind.APP; head: NodThunk; tail: Pln }
    | { kind: NodKind.NAT; nat: bigint }

enum ThunkState {
    THUNK = 1,
    VAL
}

type NodThunk =
    | { state: ThunkState.THUNK; val: () => Nod }
    | { state: ThunkState.VAL; val: Nod }

type Pln = { arity: number, nod: NodThunk }

function natArity(n : bigint) : number {
    if (n == 0n) {
        return 3; // FUN
    } else if (n == 1n) {
        return 4;
    } else if (n == 2n) {
        return 3;
    } else {
        return 1;
    }
}

function evalArity(nodT : NodThunk) : number {
    let nod = force(nodT);
    if (nod.kind == NodKind.APP) {
        return evalArity(nod.head) - 1;
    } else if (nod.kind == NodKind.NAT) {
        return natArity(nod.nat);
    } else {
        throw "Unimplemented evalArity";
    }
}

function nodVal(nod : NodThunk) : Pln {
    return { arity: evalArity(nod), nod: nod }
}

function force(t : NodThunk) : Nod {
    if (t.state == ThunkState.VAL) {
        return t.val;
    } else {
        let v = t.val();
        Object.assign(t, { state: ThunkState.VAL, val: v });
        return v;
    }
}


function toNat(pln : Pln) : bigint {
    let nod = force(pln.nod);
    if (nod.kind == NodKind.NAT) {
        return nod.nat;
    } else {
        return 0n;
    }
}

// Natural literals are just always preevaluated.
function mkNat(nat : bigint) : NodThunk {
    return { state: ThunkState.VAL, val: { kind: NodKind.NAT, nat: nat } }
}

// Build a lazy APP
function mkApp(head : NodThunk, tail : Pln) : NodThunk {
    return { state: ThunkState.THUNK, val: () => {
        return { kind: NodKind.APP, head: head, tail: tail } }
           }
}

function pluneval(n : Nod, args : Pln[]) : Pln {
    if (n.kind == NodKind.APP) {
        return pluneval(force(n.head), [n.tail].concat(args));
    } else if (n.kind == NodKind.NAT) {
        if (n.nat == 0n && args.length == 3) {
            throw "mkLaw unimplemented";
        } else if (n.nat == 1n && args.length == 4) {
            let f, a, n, x;
            [f, a, n, x] = args;
            let arity = x.arity;
            let nod = force(x.nod);

            if (nod.kind == NodKind.APP) {
                return push(push(a, { arity: arity + 1, nod: nod.head }), nod.tail);
            } else if (nod.kind == NodKind.NAT) {
                return push(n, x);
            } else {
                throw "rest of cases in wut";
            }
        } else if (n.nat == 2n && args.length == 3) {
            let z, p, x;
            [z, p, x] = args;
            let n = toNat(x);
            if (n == 0n) {
                return z;
            } else {
                return push(p, nodVal(mkNat(n - 1n)));
            }
        } else if (n.nat == 3n && args.length == 1) {
            return nodVal(mkNat(toNat(args[0]) + 1n));
        } else {
            return nodVal(mkNat(0n));
        }
    } else {
        throw 'Unimplemented in pluneval';
    }
}

// Entry point.
//
// (%%) :: Pln -> Pln -> Pln
function push(head : Pln, tail : Pln) : Pln {
    if (head.arity == 1) {
        return pluneval(force(head.nod), [tail])
    } else {
        return {arity: head.arity - 1, nod: mkApp(head.nod, tail) }
    }
}

//{ arity: 4, nod: { state: 2, val: { kind: 2, nat: 1n } } }
//{ arity: 4, nod: { state: 'VAL', val: { kind: 'NAT', nat: 1n } } }
let result = push(nodVal(mkNat(3n)), nodVal(mkNat(0n)));
console.log(result);
