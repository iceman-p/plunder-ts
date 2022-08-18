import { FanKind, Nat, Fan } from "../src/types"

import * as p from '../src/index';
import * as s from '../src/sire';
import { sire } from '../src/sire';

function E(val:Fan)          : Fan { return p.whnf(val);       }
function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

function R(...i:s.ExportType[]) : Fan { return E(s.arrayToExport(i)); }

describe('test the haskell sire integration', () => {
    test('parse nat', () => {
        expect(s.parse(5n)).toStrictEqual(N(5n));
    });

    test('parse app', () => {
        expect(s.parse([2n, 5n])).toStrictEqual(A(N(2n), N(5n)));
    });

    test('parse long app', () => {
        expect(s.parse([1n, 2n, 3n, 4n]))
            .toStrictEqual(A(A(A(N(1n), N(2n)), N(3n)), N(4n)));
    });

    test('parse nesting', () => {
        // toString() because of functions.
        expect(s.parse([2n, [2n, 3n], [4n, 5n]]).toString())
            .toStrictEqual(A(A(N(2n),
                               A(N(2n), N(3n))),
                             A(N(4n), N(5n))).toString());
    });
});

describe('small sire tests', () => {
    // All these tests have the same format: name, input to evaluate, output to
    // check.
    let eq = function (name : string, i:s.ExportType[], o:s.ExportType) {
        test(name, () => {
            expect(E(s.arrayToExport(i))).toStrictEqual(s.parse(o));
        });
    }

    eq('isFun isFun', [sire.isFun, sire.isFun], 1n);
    eq('isFun 5', [sire.isFun, 5n], 0n);
    eq('isApp (add 1)', [sire.isApp, [sire.add, 1n]], 1n);
    eq('isApp 3', [sire.isApp, 3n], 0n);
    eq('isNat 3n', [sire.isNat, 3n], 1n);
    eq('isNat add', [sire.isNat, sire.add], 0n);

    eq('K', [sire.K, 1n, 2n], 1n);
    eq('__if __true', [sire.__if, sire.__true, 5n, 7n], 5n);
    eq('__if __false', [sire.__if, sire.__false, 5n, 7n], 7n);
    eq('not 0', [sire.not, 0n], 1n);
    eq('not 1', [sire.not, 1n], 0n);
    eq('and 0 0', [sire.and, 0n, 0n], 0n);
    eq('and 1 0', [sire.and, 1n, 0n], 0n);
    eq('and 1 1', [sire.and, 1n, 1n], 1n);

    eq('ifNot __true 5 6', [sire.ifNot, sire.__true, 5n, 6n], 6n);
    eq('ifNot __false 5 6', [sire.ifNot, sire.__false, 5n, 6n], 5n);

    eq('dec', [sire.dec, 81n], 80n);
    eq('mul', [sire.mul, 2n, 3n], 6n);
    eq('min', [sire.min, 41n, 34n], 34n);

    eq('met 0', [sire.met, 0n], 0n);
    eq('met 1', [sire.met, 1n], 1n);
    eq('met 5', [sire.met, 5n], 3n);
    // RangeError: Maximum call stack size exceeded
    //eq('met 512321', [sire.met, 512321n], 19n);

    eq('eql 5 4', [sire.eql, 5n, 4n], 0n);
    eq('eql 5 5', [sire.eql, 5n, 5n], 1n);
    eq('eql (cow 5) (cow 5)', [sire.eql, [sire.cow, 5n], [sire.cow, 5n]], 1n);
    eq('eql 5 (cow 5)', [sire.eql, 5n, [sire.cow, 5n]], 0n);
});
