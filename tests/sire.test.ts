import { Kind, Nat, Fan } from "../src/types"

import * as p from '../src/index';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

type ExportType =
    | bigint
    | ExportType[]
    | Fan

function parse(e:ExportType) : Fan {
    let f : Fan;
    if (typeof e === 'bigint') {
        f = N(e);
    } else if (Array.isArray(e)) {
        f = arrayToExport(e);
    } else {
        f = e as Fan;
    }
    return f;
}

function arrayToExport(e:ExportType[]) : Fan {
    if (e.length == 0) {
        throw "Impossible empty array in arrayToExport"
    } else if (e.length == 1) {
        return parse(e[0]);
    } else {
        return A(arrayToExport(e.slice(0, -1)), parse(e.slice(-1)));
    }
}

function run(e:ExportType) {
    return F(parse(e));
}

function runpin(e:ExportType) {
    let raw = p.mkApp(N(2n), F(parse(e)));
    let arity = p.rawArity(raw);

    // A pin simply calls its arguments. For f(a, b, c), it calls an inner
    // values with (a, b, c). Therefore we have to build that here.
    for (let i = 1n; i <= arity; ++i) {
        raw = arrayToExport([0n, raw, N(i)]);
    }

    // Are these in the right order now?
    let final = F(arrayToExport([0n, 0n, N(arity), raw]));
    console.log("arity: ", arity, "raw: ", raw, "final: ", final);

    return final
}

describe('test the haskell sire integration', () => {
    test('parse nat', () => {
        expect(parse(5n)).toStrictEqual(N(5n));
    });

    test('parse app', () => {
        expect(parse([2n, 5n])).toStrictEqual(A(N(2n), N(5n)));
    });

    test('parse long app', () => {
        expect(parse([1n, 2n, 3n, 4n]))
            .toStrictEqual(A(A(A(N(1n), N(2n)), N(3n)), N(4n)));
    });

    test('parse nesting', () => {
        // toString() because of functions.
        expect(parse([2n, [2n, 3n], [4n, 5n]]).toString())
            .toStrictEqual(A(A(N(2n),
                               A(N(2n), N(3n))),
                             A(N(4n), N(5n))).toString());
    });
});

describe('small sire tests', () => {
/*
    let mkFun = run(0n);
    let valCase = run(1n);
    let natCase = run(2n);
    let inc = run(3n);
    let force = runpin([0n, 435460140902n, 1n, [0n, [2n, [0n, 0n, 0n]], [0n, 2n, 1n]]]);
    let seq = runpin([0n, 7431539n, 2n, [0n, [0n, [0n, [2n, 2n], 2n], [0n, [0n, 0n, 2n, 1n], 2n]], 1n]]);
    let deepseq = runpin([0n, 31918218849641828n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, seq], 1n], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, force], 1n]], 1n]], 2n]]);
    let trk = runpin([0n, 7041652n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, deepseq], 1n], 2n]], 1n], 2n]]);
    let die = runpin([0n, 6646116n, 1n, [0n, 0n, 1n]]);
    let isFun = runpin([0n, 474413953897n, 1n, [0n, [1n, [0n, 0n, 3n, [2n, 1n]], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
    let isApp = runpin([0n, 482919674729n, 1n, [0n, [1n, [0n, 0n, 3n, [2n, 0n]], [0n, 0n, 2n, [2n, 1n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
    let isNat = runpin([0n, 499848737641n, 1n, [0n, [1n, [0n, 0n, 3n, [2n, 0n]], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 1n]]], 1n]]);
    let car = runpin([0n, 7496035n, 1n, [0n, [1n, [0n, 0n, 3n, [0n, [0n, [2n, 0n], 1n], 2n]], [0n, 0n, 2n, 1n], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
    let cdr = runpin([0n, 7496803n, 1n, [0n, [1n, [0n, 0n, 3n, 3n], [0n, 0n, 2n, 2n], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
    let funName = runpin([0n, 28549237342893414n, 1n, [0n, [1n, [0n, 0n, 3n, 1n], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
    let funArgs = runpin([0n, 32483362743416166n, 1n, [0n, [1n, [0n, 0n, 3n, 2n], [0n, 0n, 2n, [2n, 0n]], [0n, 0n, 1n, [2n, 0n]]], 1n]]);
    let funBody = run([0n, 0n, 1n, [0n, [2n, cdr], 1n]]);
    let c2 = run([0n, 0n, 3n, 0n]);
    let trkVal = runpin([0n, 119165317509748n, 2n, [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, trk], 1n], 2n]], [0n, [0n, [0n, 0n, 3n, 0n], 2n], 1n]], 2n]]);
    let caar = runpin([0n, 1918984547n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], 1n]]]);
    let cadr = runpin([0n, 1919181155n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], 1n]]]);
    let cdar = runpin([0n, 1918985315n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], 1n]]]);
    let cddr = runpin([0n, 1919181923n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], 1n]]]);
    let caaar = runpin([0n, 491260043619n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], 1n]]]]);
    let caadr = runpin([0n, 491310375267n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], 1n]]]]);
    let cadar = runpin([0n, 491260240227n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], 1n]]]]);
    let caddr = runpin([0n, 491310571875n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], 1n]]]]);
    let cdaar = runpin([0n, 491260044387n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], 1n]]]]);
    let cdadr = runpin([0n, 491310376035n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], 1n]]]]);
    let cddar = runpin([0n, 491260240995n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, car], 1n]], 1n]]]]);
    let cdddr = runpin([0n, 491310572643n, 1n, [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], [0n, [0n, 0n, 1n, [0n, [2n, cdr], 1n]], 1n]]]]);
    */
    let S = runpin([0n, 83n, 3n, [0n, [0n, 1n, 3n], [0n, 2n, 3n]]]);
    let K = runpin([0n, 75n, 2n, 1n]);
    let I = runpin([0n, 73n, 1n, 1n]);
    let B = runpin([0n, 66n, 3n, [0n, 1n, [0n, 2n, 3n]]]);
    let apply = runpin([0n, 521510350945n, 2n, [0n, 1n, 2n]]);
    let supply = runpin([0n, 133506649847155n, 2n, [0n, 2n, 1n]]);
    let compose = run([0n, 0n, 3n, [0n, [0n, [0n, [2n, B], 1n], 2n], 3n]]);


    let __true = run(1n);
    let __false = run(0n);
    let __if = runpin([0n, 26217n, 3n, [0n, [0n, [0n, [2n, 2n], 3n], [0n, [0n, 0n, 2n, 1n], 2n]], 1n]]);

/*
    let not = runpin([0n, 7630702n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, __if], 1n], 2n], 3n]], 1n], [2n, 0n]], [2n, 1n]]]);
    let bit = runpin([0n, 7629154n, 1n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, __if], 1n], 2n], 3n]], 1n], [2n, 1n]], [2n, 0n]]]);
    let and = runpin([0n, 6581857n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, __if], 1n], 2n], 3n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, bit], 1n]], 2n]], [2n, 0n]]]);
    let or = runpin([0n, 29295n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, __if], 1n], 2n], 3n]], 1n], [2n, 1n]], [0n, [0n, 0n, 1n, [0n, [2n, bit], 1n]], 2n]]]);
    let xor = runpin([0n, 7499640n, 2n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, __if], 1n], 2n], 3n]], 1n], [0n, [0n, 0n, 1n, [0n, [2n, not], 1n]], 2n]], [0n, [0n, 0n, 1n, [0n, [2n, bit], 1n]], 2n]]]);
    let nand = runpin([0n, 1684955502n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, and], 1n], 2n]], 1n], 2n]]]);
    let nor = runpin([0n, 7499630n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, or], 1n], 2n]], 1n], 2n]]]);
    let xnor = runpin([0n, 1919905400n, 2n, [0n, [0n, 0n, 1n, [0n, [2n, not], 1n]], [0n, [0n, [0n, 0n, 2n, [0n, [0n, [2n, xor], 1n], 2n]], 1n], 2n]]]);
    let ifNot = runpin([0n, 500083615337n, 3n, [0n, [0n, [0n, [0n, 0n, 3n, [0n, [0n, [0n, [2n, __if], 1n], 2n], 3n]], [0n, [0n, 0n, 1n, [0n, [2n, not], 1n]], 1n]], 2n], 3n]]);
*/

    test('K', () => {
        expect(F(p.AP(K, N(1n), N(2n)))).toStrictEqual(N(1n));
    });

    test('__if', () => {
        expect(F(p.AP(__if, __true, N(5n), N(7n)))).toStrictEqual(N(5n));
        expect(F(p.AP(__if, __false, N(5n), N(7n)))).toStrictEqual(N(7n));
    });
});
