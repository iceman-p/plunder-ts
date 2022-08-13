import { Kind, Nat, Fan } from "../src/types"

import * as p from '../src/index';
import * as n from '../src/index';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }
function N(nat:Nat)          : Fan { return p.mkNat(nat);      }

describe('testing new fanToRun', () => {
  test('expect this reference', () => {
    expect(n.fanToRun(0, N(0n))).toStrictEqual(
      [[], {t: n.RunKind.REF, r:"this"}]);
  });

  test('expect `a` reference', () => {
    expect(n.fanToRun(1, N(1n))).toStrictEqual(
      [[], {t: n.RunKind.REF, r:"a"}]);
  });

  test('testing raw unmatched large constant', () => {
    expect(n.fanToRun(0, N(50n))).toStrictEqual(
      [[], { t: p.RunKind.CNS, c: N(50n) }]);
  });

  test('testing `(2 x)` returns x', () => {
    expect(n.fanToRun(1, p.mkApp(N(2n), N(50n))))
      .toStrictEqual(
        [[], { t: p.RunKind.CNS, c: N(50n) }]);
  });

  test('testing `(0 1 2)` case with refs', () => {
    expect(n.fanToRun(2, A(A(N(0n), N(1n)), N(2n))))
      .toStrictEqual([[],
                      { t: p.RunKind.KAL,
                        f: { t: p.RunKind.REF, r: "a" },
                        x: { t: p.RunKind.REF, r: "b" }}]);
  });

  test('testing `(1 1 2)`', () => {
    expect(n.fanToRun(1, p.mkApp(p.mkApp(N(1n), N(1n)), N(2n))))
      .toStrictEqual([[["b", { t: p.RunKind.REF, r: "a" }]],
                      { t: p.RunKind.REF, r: "b" }]);
  });
});

describe('testing compiler integration', () => {
  test('compile and run test (1 1 2)', () => {
    let f = n.compile(0n, 1n, p.mkApp(p.mkApp(N(1n), N(1n)), N(2n)));
    expect(f(N(30n))).toStrictEqual(N(30n));
  });
});

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
