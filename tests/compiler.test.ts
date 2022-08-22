import { FanKind, Nat, Fan } from "../src/types"

import * as p from '../src/index';
import * as n from '../src/index';

function F(val:Fan)          : Fan { return p.force(val);      }
function A(fun:Fan, arg:Fan) : Fan { return p.mkApp(fun, arg); }

describe('testing new fanToRun', () => {
  test('expect self reference', () => {
    expect(n.fanToRun(0, 0n)).toStrictEqual(
      [[], {t: n.RunKind.REF, r:"self"}]);
  });

  test('expect `a` reference', () => {
    expect(n.fanToRun(1, 1n)).toStrictEqual(
      [[], {t: n.RunKind.REF, r:"a"}]);
  });

  test('testing raw unmatched large constant', () => {
    expect(n.fanToRun(0, 50n)).toStrictEqual(
      [[], { t: p.RunKind.CNS, c: 50n }]);
  });

  test('testing `(2 x)` returns x', () => {
    expect(n.fanToRun(1, p.mkApp(2n, 50n)))
      .toStrictEqual(
        [[], { t: p.RunKind.CNS, c: 50n }]);
  });

  test('testing `(0 1 2)` case with refs', () => {
    expect(n.fanToRun(2, A(A(0n, 1n), 2n)))
      .toStrictEqual([[],
                      { t: p.RunKind.KAL,
                        f: { t: p.RunKind.REF, r: "a" },
                        x: { t: p.RunKind.REF, r: "b" }}]);
  });

  test('testing `(1 1 2)`', () => {
    expect(n.fanToRun(1, p.mkApp(p.mkApp(1n, 1n), 2n)))
      .toStrictEqual([[["b", { t: p.RunKind.REF, r: "a" }]],
                      { t: p.RunKind.REF, r: "b" }]);
  });
});

describe('testing compiler integration', () => {
  test('compile and run test (1 1 2)', () => {
    let name = 0n;
    let args = 1n;
    let body = p.mkApp(p.mkApp(1n, 1n), 2n);
    let execu = () => { throw "Infinite Loop"; }
    let self = {t: FanKind.FUN, n:name, a:args, b:body, x:execu};
    let f = n.compile(self as Fan, name, args, body);
    self.x = f;
    expect(f(30n)).toStrictEqual(30n);
  });
});

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2
