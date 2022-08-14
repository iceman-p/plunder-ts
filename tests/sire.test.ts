import { Kind, Nat, Fan } from "../src/types"

import * as p from '../src/index';
import * as s from '../src/sire';
import { sire } from '../src/sire';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

function R(...i:s.ExportType[]) : Fan { return F(s.arrayToExport(i)); }

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
    test('K', () => {
   //     console.log(sire);
        expect(F(p.AP(sire.K, N(1n), N(2n)))).toStrictEqual(N(1n));
    });

    test('__if', () => {
        expect(R(sire.__if, sire.__true, 5n, 7n))
            .toStrictEqual(N(5n));
        expect(R(sire.__if, sire.__false, 5n, 7n))
            .toStrictEqual(N(7n));
    });

    test('min', () => {
        expect(R(sire.min, 41n, 34n)).toStrictEqual(N(34n));
    });
});
