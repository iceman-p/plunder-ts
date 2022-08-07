import { Kind, Nat, Fan } from "../src/types"

import * as p from '../src/index';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

function expectFanLine(...args : Fan[]) {
  let prev = p.AP(args[0], ...args.slice(1));
  return expect(F(prev));
}

function line(...args : Fan[]) {
  return F(p.AP(args[0], ...args.slice(1)));
}

describe('testing nat evaluation', () => {
  // test('testing wut check NAT `1 `', () => {
  // });

  test('testing increment `3 5` -> 6', () => {
    expectFanLine(N(3n), N(5n)).toStrictEqual(N(6n));
  });

  test('testing wut nat check `1 0 0 3 5` -> 6', () => {
    expectFanLine(N(1n), N(0n), N(0n), N(3n), N(5n)).toStrictEqual(N(6n));
  });

  test('testing integer zero check `2 10 11 0` -> 10', () => {
    expectFanLine(N(2n), N(10n), N(11n), N(0n)).toStrictEqual(N(10n));
  });

  test('testing integer positive check `2 10 3 15` -> 15', () => {
    expectFanLine(N(2n), N(10n), N(3n), N(15n)).toStrictEqual(N(15n));
  });

});

describe('compiler tests', () => {
  describe('first pass FAN to Run tests', () => {
    test('raw nat within arg range is a reference', () => {
      expect(p.fanToRun(1, N(1n))).toStrictEqual(
        [1, { t: p.RunKind.REF, r: 1 }]);
    });

    test('testing raw unmatched large constant', () => {
      expect(p.fanToRun(0, N(50n))).toStrictEqual(
        [0, { t: p.RunKind.CNS, c: N(50n) }]);
    });

    test('testing `(2 x)` returns x', () => {
      expect(p.fanToRun(1, p.mkApp(N(2n), N(50n))))
        .toStrictEqual(
          [1, { t: p.RunKind.CNS, c: N(50n) }]);
    });

    test('testing `(0 1 2)` case with refs', () => {
      expect(p.fanToRun(2, A(A(N(0n), N(1n)), N(2n))))
        .toStrictEqual([2, { t: p.RunKind.KAL,
                             f: { t: p.RunKind.REF, r: 1 },
                             x: { t: p.RunKind.REF, r: 2 }}]);

    });

    test('testing `(1 1 2)`', () => {
      expect(p.fanToRun(1, p.mkApp(p.mkApp(N(1n), N(1n)), N(2n))))
        .toStrictEqual([2, { t: p.RunKind.LET,
                             i: 2,
                             v: { t: p.RunKind.REF, r: 1 },
                             f: { t: p.RunKind.REF, r: 2 } } ]);
    });
  });

  describe("function execution tests", () => {
    test('test function application ((0 1 1 1) 5)', () => {
      let f = line(N(0n), N(1n), N(1n), N(1n));
      expect(F(A(f, N(5n)))).toStrictEqual(N(5n));
    });

    // TODO: This still fails.
    test('test function application ((0 1 1 (2 7)) 5)', () => {
      let f = line(N(0n), N(1n), N(1n), line(N(2n), N(7n)));
      expect(F(A(f, N(5n)))).toStrictEqual(N(7n));
    });
  });
});


// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
